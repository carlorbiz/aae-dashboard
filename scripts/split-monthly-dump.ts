/**
 * Split Monthly Conversation Dumps into Individual Conversations
 *
 * Usage:
 *   npx tsx scripts/split-monthly-dump.ts <monthly-file.md>
 *   npx tsx scripts/split-monthly-dump.ts conversations/monthly-dumps/claude/Claude_2024-11.md
 *
 * This script:
 * 1. Detects conversation boundaries using separators/timestamps
 * 2. Extracts metadata (date, topics, participants)
 * 3. Creates individual conversation files
 * 4. Adds standardized headers
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ConversationMetadata {
  agent: string;
  date: string;
  topic: string;
  participants: string[];
  startLine: number;
  endLine: number;
  content: string;
}

/**
 * Detect conversation boundaries in monthly dump
 */
function detectConversations(content: string, agentName: string): ConversationMetadata[] {
  const lines = content.split('\n');
  const conversations: ConversationMetadata[] = [];

  let currentConvo: Partial<ConversationMetadata> | null = null;
  let currentContent: string[] = [];

  const separatorPattern = /^={3,}|^-{3,}|^\*{3,}/; // ===, ---, ***
  const timestampPattern = /(?:conversation started|date|timestamp):\s*(\d{4}-\d{2}-\d{2})/i;
  const topicPattern = /(?:topic|subject|re):\s*(.+)/i;
  const participantPattern = /^(user|claude|cc|fred|gemini|grok|manus|penny|pete|colin|jan|callum|notebook[ -]?lm|carla):/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect conversation boundary (separator line)
    if (separatorPattern.test(line.trim())) {
      // Save previous conversation if exists
      if (currentConvo && currentContent.length > 0) {
        conversations.push({
          agent: agentName,
          date: currentConvo.date || extractDateFromContent(currentContent.join('\n')),
          topic: currentConvo.topic || extractTopicFromContent(currentContent.join('\n')),
          participants: currentConvo.participants || extractParticipants(currentContent.join('\n')),
          startLine: currentConvo.startLine || 0,
          endLine: i - 1,
          content: currentContent.join('\n').trim(),
        });
      }

      // Start new conversation
      currentConvo = {
        agent: agentName,
        startLine: i + 1,
        participants: ['Carla', agentName], // Default participants
      };
      currentContent = [];
      continue;
    }

    // Extract metadata from current line
    if (currentConvo) {
      // Check for timestamp
      const timestampMatch = line.match(timestampPattern);
      if (timestampMatch) {
        currentConvo.date = timestampMatch[1];
      }

      // Check for topic
      const topicMatch = line.match(topicPattern);
      if (topicMatch && !currentConvo.topic) {
        currentConvo.topic = topicMatch[1].trim();
      }

      // Collect content
      currentContent.push(line);
    }
  }

  // Save last conversation
  if (currentConvo && currentContent.length > 0) {
    conversations.push({
      agent: agentName,
      date: currentConvo.date || extractDateFromContent(currentContent.join('\n')),
      topic: currentConvo.topic || extractTopicFromContent(currentContent.join('\n')),
      participants: currentConvo.participants || extractParticipants(currentContent.join('\n')),
      startLine: currentConvo.startLine || 0,
      endLine: lines.length - 1,
      content: currentContent.join('\n').trim(),
    });
  }

  return conversations;
}

/**
 * Extract date from conversation content (fallback)
 */
function extractDateFromContent(content: string): string {
  // Look for any date pattern in content
  const datePattern = /\b(\d{4}-\d{2}-\d{2})\b/;
  const match = content.match(datePattern);
  if (match) return match[1];

  // Default to today
  return new Date().toISOString().split('T')[0];
}

/**
 * Extract topic from conversation content (first user message or key phrases)
 */
function extractTopicFromContent(content: string): string {
  // Try to find first user message
  const firstUserMsg = content.match(/^user:\s*(.+?)(?:\n|$)/im);
  if (firstUserMsg) {
    const msg = firstUserMsg[1].trim();
    // Take first 50 chars as topic
    return msg.length > 50 ? msg.substring(0, 47) + '...' : msg;
  }

  // Look for key technology mentions
  const techPattern = /\b(notion|github|n8n|zapier|mem0|mcp|cloudflare|d1|trpc|drizzle|knowledge graph|database|deployment)\b/i;
  const techMatch = content.match(techPattern);
  if (techMatch) return techMatch[1];

  return 'General Discussion';
}

/**
 * Extract participants from conversation content
 */
function extractParticipants(content: string): string[] {
  const participants = new Set<string>(['Carla']); // Always include Carla

  const participantPattern = /^(user|claude|cc|fred|gemini|grok|manus|penny|pete|colin|jan|callum|notebook[ -]?lm):/img;
  const matches = content.matchAll(participantPattern);

  for (const match of matches) {
    const name = match[1].toLowerCase();
    // Normalize names
    if (name === 'user') participants.add('Carla');
    else if (name === 'cc') participants.add('Claude Code');
    else if (name === 'notebook-lm' || name === 'notebook lm') participants.add('Notebook LM');
    else participants.add(name.charAt(0).toUpperCase() + name.slice(1));
  }

  return Array.from(participants);
}

/**
 * Generate standardized markdown header
 */
function generateHeader(convo: ConversationMetadata, sourceFile: string): string {
  return `# Conversation with ${convo.agent}
**Date**: ${convo.date}
**Participants**: ${convo.participants.join(', ')}
**Topics**: ${convo.topic}
**Source**: ${path.basename(sourceFile)} (lines ${convo.startLine}-${convo.endLine})

---

`;
}

/**
 * Main processing function
 */
async function processMonthlyDump(filePath: string) {
  console.log('📥 Processing monthly conversation dump...\n');
  console.log(`📄 Source: ${filePath}\n`);

  try {
    // Read source file
    const content = await fs.readFile(filePath, 'utf-8');

    // Extract agent name from filename (e.g., "Claude_2024-11.md" → "Claude")
    const filename = path.basename(filePath, '.md');
    const agentName = filename.split('_')[0];

    console.log(`🤖 Agent: ${agentName}`);
    console.log(`📏 File size: ${(content.length / 1024).toFixed(2)} KB\n`);

    // Detect conversations
    console.log('🔍 Detecting conversation boundaries...');
    const conversations = detectConversations(content, agentName);
    console.log(`✅ Found ${conversations.length} conversations\n`);

    if (conversations.length === 0) {
      console.log('⚠️  No conversations detected. Check separator format.');
      console.log('   Expected: ===== or ----- or ***** between conversations');
      return;
    }

    // Create output directory
    const outputDir = path.join(__dirname, '../conversations/processed');
    await fs.mkdir(outputDir, { recursive: true });

    // Write individual conversation files
    console.log('📝 Creating individual conversation files...\n');

    const results = {
      success: 0,
      failed: 0,
      files: [] as string[],
    };

    for (let i = 0; i < conversations.length; i++) {
      const convo = conversations[i];

      // Generate filename: Agent_YYYYMMDD_Topic.md
      const datePart = convo.date.replace(/-/g, '');
      const topicPart = convo.topic
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '')
        .substring(0, 30);

      const outputFilename = `${agentName}_${datePart}_${topicPart}_${i + 1}.md`;
      const outputPath = path.join(outputDir, outputFilename);

      try {
        // Generate full content with header
        const header = generateHeader(convo, filePath);
        const fullContent = header + convo.content;

        await fs.writeFile(outputPath, fullContent, 'utf-8');

        console.log(`  ✅ Created: ${outputFilename}`);
        console.log(`     Date: ${convo.date}`);
        console.log(`     Topic: ${convo.topic}`);
        console.log(`     Size: ${(fullContent.length / 1024).toFixed(2)} KB\n`);

        results.success++;
        results.files.push(outputFilename);
      } catch (error: any) {
        console.error(`  ❌ Failed to create ${outputFilename}: ${error.message}\n`);
        results.failed++;
      }
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Processing Summary:');
    console.log(`   ✅ Success: ${results.success} files`);
    console.log(`   ❌ Failed: ${results.failed} files`);
    console.log(`   📁 Output: ${outputDir}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✨ Next steps:');
    console.log(`   1. Review files in: ${outputDir}`);
    console.log('   2. Run batch ingestion: npx tsx scripts/batch-ingest.ts\n');

  } catch (error: any) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: No file path provided\n');
  console.log('Usage: npx tsx scripts/split-monthly-dump.ts <monthly-file.md>\n');
  console.log('Example:');
  console.log('  npx tsx scripts/split-monthly-dump.ts conversations/monthly-dumps/claude/Claude_2024-11.md\n');
  process.exit(1);
}

processMonthlyDump(args[0]);
