import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";
import axios from "axios";

export const chatRouter = router({
  // Send a message and get AI response
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string(),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Gather context about the user's AAE
      const [platforms, workflows, llmSummary] = await Promise.all([
        db.getPlatformIntegrations(userId),
        db.getWorkflows(userId),
        db.getLLMSummary(userId),
      ]);

      // Query Knowledge Lake for relevant context
      const knowledgeLakeUrl = process.env.KNOWLEDGE_LAKE_URL || 'https://knowledge-lake-api-production.up.railway.app';
      let relevantKnowledge: any[] = [];

      try {
        const response = await axios.post(`${knowledgeLakeUrl}/api/query`, {
          query: input.message,
          userId: userId,
          limit: 5
        });

        if (response.data.success && response.data.results) {
          relevantKnowledge = response.data.results;
        }
      } catch (error: any) {
        console.error('[Chat] Failed to query Knowledge Lake:', error.message);
      }

      // Build context for the AI
      const contextMessage = `You are an AI assistant helping the user manage their AI Automation Ecosystem (AAE) dashboard. Here's the current state of their system:

PLATFORM INTEGRATIONS:
${platforms.map(p => `- ${p.platform}: ${p.status} (last synced: ${p.lastSynced ? new Date(p.lastSynced).toLocaleString() : 'never'})`).join('\n')}

WORKFLOWS:
${workflows.slice(0, 5).map(w => `- ${w.name} (${w.workflowType}): ${w.status} - ${w.runCount} runs, ${w.successCount} successful`).join('\n')}

LLM METRICS:
- Total Requests: ${llmSummary?.totalRequests || 0}
- Total Tokens: ${llmSummary?.totalTokens || 0}
- Total Cost: $${llmSummary?.totalCost ? (llmSummary.totalCost / 100).toFixed(2) : '0.00'}
- Avg Response Time: ${llmSummary?.avgResponseTime || 0}ms

RELEVANT KNOWLEDGE FROM YOUR CONVERSATIONS:
${relevantKnowledge.length > 0 ? relevantKnowledge.map(k => {
  if (k.content) {
    return `- ${k.content.substring(0, 200)}${k.content.length > 200 ? '...' : ''}`;
  } else if (k.topic) {
    return `- Topic: ${k.topic}`;
  }
  return '- (No content available)';
}).join('\n') : '(No relevant knowledge found)'}

The user can ask you questions about their dashboard, request insights, or ask you to help update settings. You have access to all their past conversations and knowledge through the Knowledge Lake. Be helpful, concise, and actionable. If the user asks to update something, explain what you would do (note: actual updates require additional implementation).`;

      // Build message history
      const messages = [
        { role: "system" as const, content: contextMessage },
        ...(input.conversationHistory || []),
        { role: "user" as const, content: input.message },
      ];

      // Call LLM
      const response = await invokeLLM({
        messages,
      });

      const assistantMessage = typeof response.choices[0]?.message?.content === 'string'
        ? response.choices[0].message.content
        : "I'm sorry, I couldn't process that request.";

      return {
        message: assistantMessage,
        timestamp: new Date(),
      };
    }),

  // Get suggested questions based on current dashboard state
  getSuggestedQuestions: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const [platforms, workflows, llmSummary] = await Promise.all([
      db.getPlatformIntegrations(userId),
      db.getWorkflows(userId),
      db.getLLMSummary(userId),
    ]);

    const suggestions: string[] = [];

    // Platform-related suggestions
    const disconnectedPlatforms = platforms.filter(p => p.status !== "connected");
    if (disconnectedPlatforms.length > 0) {
      suggestions.push(`Why are ${disconnectedPlatforms.length} platforms disconnected?`);
    }

    // Workflow-related suggestions
    const errorWorkflows = workflows.filter(w => w.status === "error");
    if (errorWorkflows.length > 0) {
      suggestions.push(`What's wrong with my failing workflows?`);
    }

    // LLM-related suggestions
    if (llmSummary?.totalRequests && llmSummary.totalRequests > 0) {
      suggestions.push("How can I optimize my LLM costs?");
      suggestions.push("Which LLM provider is most cost-effective?");
    }

    // General suggestions
    suggestions.push("Give me a summary of my AAE health");
    suggestions.push("What should I focus on improving?");
    suggestions.push("Show me my most active workflows");

    return suggestions.slice(0, 6);
  }),
});
