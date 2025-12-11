/**
 * Entity Extractor - Identifies entities from conversation content using rule-based patterns
 */

import type { ConversationChunk, ExtractedEntity, EntityType } from './types';

export class EntityExtractor {
  /**
   * Extract entities from a conversation chunk
   */
  extractEntities(chunk: ConversationChunk): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Apply all extraction rules
    entities.push(...this.identifyAgents(chunk.content));
    entities.push(...this.identifyTechnologies(chunk.content));
    entities.push(...this.identifyProjects(chunk.content));
    entities.push(...this.identifyConsultingWork(chunk.content));
    entities.push(...this.identifyClientIntelligence(chunk.content));

    // Deduplicate by name (case-insensitive)
    return this.deduplicate(entities);
  }

  /**
   * Extract agent entities (high confidence)
   */
  private identifyAgents(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Known agent names with variants
    const agentPatterns = [
      { name: 'Claude', variants: ['Claude'] },
      { name: 'Claude Code', variants: ['Claude Code', 'CC'] },
      { name: 'Manus', variants: ['Manus'] },
      { name: 'Fred', variants: ['Fred'] },
      { name: 'Penny', variants: ['Penny'] },
      { name: 'Grok', variants: ['Grok'] },
      { name: 'Gemini', variants: ['Gemini'] },
      { name: 'Callum', variants: ['Callum'] },
      { name: 'Pete', variants: ['Pete'] },
      { name: 'Colin', variants: ['Colin'] },
      { name: 'Jan', variants: ['Jan'] },
      { name: 'Notebook LM', variants: ['Notebook LM', 'NotebookLM'] },
      { name: 'Fredo', variants: ['Fredo'] },
      { name: 'Noris', variants: ['Noris'] },
    ];

    for (const agent of agentPatterns) {
      for (const variant of agent.variants) {
        const pattern = new RegExp(`\\b${this.escapeRegex(variant)}\\b`, 'gi');
        const matches = text.matchAll(pattern);

        for (const match of matches) {
          entities.push({
            entityType: 'Agents',
            name: agent.name, // Use canonical name
            description: `AI agent: ${agent.name}`,
            confidence: 0.95, // High confidence for known agents
            sourceContext: this.extractContext(text, match.index!),
          });
        }
      }
    }

    return entities;
  }

  /**
   * Extract technology entities (medium-high confidence)
   */
  private identifyTechnologies(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    const technologies = [
      // Databases
      { name: 'D1', pattern: /\bD1\b/g, confidence: 0.85 },
      { name: 'PostgreSQL', pattern: /\b(PostgreSQL|Postgres)\b/gi, confidence: 0.9 },
      { name: 'MySQL', pattern: /\bMySQL\b/gi, confidence: 0.9 },
      { name: 'SQLite', pattern: /\bSQLite\b/gi, confidence: 0.9 },
      { name: 'Neo4j', pattern: /\bNeo4j\b/gi, confidence: 0.9 },

      // Frameworks & Libraries
      { name: 'Next.js', pattern: /\bNext\.js\b/gi, confidence: 0.9 },
      { name: 'React', pattern: /\bReact\b/g, confidence: 0.8 }, // lowercase react = low confidence
      { name: 'tRPC', pattern: /\btRPC\b/g, confidence: 0.95 },
      { name: 'Drizzle ORM', pattern: /\b(Drizzle|drizzle-orm)\b/gi, confidence: 0.9 },

      // Platforms
      { name: 'Cloudflare', pattern: /\bCloudflare\b/gi, confidence: 0.9 },
      { name: 'Cloudflare Workers', pattern: /\b(Cloudflare Workers|Workers)\b/gi, confidence: 0.85 },
      { name: 'Notion', pattern: /\bNotion\b/g, confidence: 0.9 },
      { name: 'GitHub', pattern: /\b(GitHub|Github)\b/gi, confidence: 0.9 },
      { name: 'n8n', pattern: /\bn8n\b/g, confidence: 0.95 },
      { name: 'Zapier', pattern: /\bZapier\b/gi, confidence: 0.9 },

      // AI/Memory Systems
      { name: 'mem0', pattern: /\bmem0\b/gi, confidence: 0.95 },
      { name: 'Memory Lake', pattern: /\bMemory Lake\b/gi, confidence: 0.9 },
      { name: 'OpenMemory', pattern: /\bOpenMemory\b/gi, confidence: 0.9 },
      { name: 'MCP', pattern: /\bMCP\b/g, confidence: 0.85 },

      // Development Tools
      { name: 'Docker', pattern: /\bDocker\b/gi, confidence: 0.9 },
      { name: 'Git', pattern: /\bGit\b/g, confidence: 0.8 }, // lowercase git = lower confidence
      { name: 'npm', pattern: /\bnpm\b/g, confidence: 0.9 },
      { name: 'TypeScript', pattern: /\bTypeScript\b/gi, confidence: 0.9 },
    ];

    for (const tech of technologies) {
      const matches = text.matchAll(tech.pattern);

      for (const match of matches) {
        entities.push({
          entityType: 'Technology',
          name: tech.name,
          description: `Technology: ${tech.name}`,
          confidence: tech.confidence,
          sourceContext: this.extractContext(text, match.index!),
        });
      }
    }

    return entities;
  }

  /**
   * Extract project/product entities (medium confidence)
   */
  private identifyProjects(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    const projects = [
      { name: 'AAE Dashboard', pattern: /\bAAE Dashboard\b/gi, confidence: 0.85 },
      { name: 'VibeSDK', pattern: /\bVibeSDK\b/gi, confidence: 0.85 },
      { name: 'Aurelia', pattern: /\bAurelia\b/g, confidence: 0.8 },
      { name: 'Aurelia AI Advisor', pattern: /\bAurelia AI Advisor\b/gi, confidence: 0.9 },
      { name: 'Knowledge Lake', pattern: /\bKnowledge Lake\b/gi, confidence: 0.85 },
      { name: 'Caretrack', pattern: /\bCaretrack\b/gi, confidence: 0.85 },
      { name: 'MTMOT', pattern: /\bMTMOT\b/g, confidence: 0.9 },
    ];

    for (const project of projects) {
      const matches = text.matchAll(project.pattern);

      for (const match of matches) {
        entities.push({
          entityType: 'ExecutiveAI',
          name: project.name,
          description: `Project: ${project.name}`,
          confidence: project.confidence,
          sourceContext: this.extractContext(text, match.index!),
        });
      }
    }

    return entities;
  }

  /**
   * Extract consulting-related entities (medium confidence)
   */
  private identifyConsultingWork(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Client names
    const clients = [
      { name: 'RWAV', pattern: /\bRWAV\b/g, confidence: 0.9 },
    ];

    for (const client of clients) {
      const matches = text.matchAll(client.pattern);

      for (const match of matches) {
        entities.push({
          entityType: 'Consulting',
          name: client.name,
          description: `Client: ${client.name}`,
          confidence: client.confidence,
          sourceContext: this.extractContext(text, match.index!),
        });
      }
    }

    // Deliverable types
    const deliverablePattern = /\b(Strategic Plan|Research Report|Implementation Roadmap|Resource Package|Coaching Program)\b/gi;
    const deliverableMatches = text.matchAll(deliverablePattern);

    for (const match of deliverableMatches) {
      entities.push({
        entityType: 'Consulting',
        name: match[1],
        description: `Consulting deliverable: ${match[1]}`,
        confidence: 0.75,
        sourceContext: this.extractContext(text, match.index!),
      });
    }

    return entities;
  }

  /**
   * Extract intelligence/insights entities (lower confidence)
   */
  private identifyClientIntelligence(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Market trends and patterns
    const trendPattern = /\b(AI adoption|digital transformation|automation|pilot purgatory|change management)\b/gi;
    const matches = text.matchAll(trendPattern);

    for (const match of matches) {
      entities.push({
        entityType: 'ClientIntelligence',
        name: match[1],
        description: `Market trend/pattern: ${match[1]}`,
        confidence: 0.65, // Lower confidence for general terms
        sourceContext: this.extractContext(text, match.index!),
      });
    }

    return entities;
  }

  /**
   * Extract context around a match position
   */
  private extractContext(text: string, position: number, contextLength = 80): string {
    const start = Math.max(0, position - contextLength);
    const end = Math.min(text.length, position + contextLength);
    let context = text.slice(start, end);

    // Add ellipsis if truncated
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';

    return context.replace(/\s+/g, ' ').trim();
  }

  /**
   * Deduplicate entities by name (case-insensitive)
   */
  private deduplicate(entities: ExtractedEntity[]): ExtractedEntity[] {
    const seen = new Map<string, ExtractedEntity>();

    for (const entity of entities) {
      const key = `${entity.entityType}:${entity.name.toLowerCase()}`;

      if (!seen.has(key)) {
        seen.set(key, entity);
      } else {
        // Keep entity with higher confidence
        const existing = seen.get(key)!;
        if (entity.confidence > existing.confidence) {
          seen.set(key, entity);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
