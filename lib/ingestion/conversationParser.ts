/**
 * Conversation Parser - Extracts metadata and chunks conversation files
 */

import fs from 'fs';
import path from 'path';
import type {
  ConversationMetadata,
  ConversationChunk,
  ParsedConversation,
  ConversationType,
} from './types';

export class ConversationParser {
  /**
   * Parse a conversation file and extract structured data
   */
  parseFile(filePath: string): ParsedConversation {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);

    // Detect conversation type
    const conversationType = this.detectFormat(content);

    // Extract metadata
    const metadata: ConversationMetadata = {
      filePath,
      fileDate: this.extractDate(content, conversationType),
      conversationType,
      participatingAgents: this.extractParticipants(content, conversationType),
      fileSize: stats.size,
    };

    // Chunk content
    const chunks = this.chunkByTopic(content);

    return {
      metadata,
      fullText: content,
      chunks,
    };
  }

  /**
   * Detect conversation format from content
   */
  private detectFormat(content: string): ConversationType {
    // Claude GUI format: "Claude chat DD/MM/YYYY"
    if (/^Claude chat \d{2}\/\d{2}\/\d{4}/m.test(content)) {
      return 'claude-gui';
    }

    // Gemini CLI format: "Gemini CLI DD/MM/YYYY" with ASCII banner
    if (/^Gemini CLI \d{2}\/\d{2}\/\d{4}/m.test(content)) {
      return 'gemini-cli';
    }

    // Agent-specific format (future)
    if (/^Agent: /m.test(content)) {
      return 'agent-specific';
    }

    return 'unknown';
  }

  /**
   * Extract date from conversation header
   */
  private extractDate(content: string, type: ConversationType): Date {
    let dateMatch: RegExpMatchArray | null = null;

    switch (type) {
      case 'claude-gui':
      case 'gemini-cli':
        // Format: DD/MM/YYYY
        dateMatch = content.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          // Validate date components
          const dayNum = parseInt(day, 10);
          const monthNum = parseInt(month, 10);
          const yearNum = parseInt(year, 10);

          if (dayNum < 1 || dayNum > 31) {
            throw new Error(`Invalid day: ${day}`);
          }
          if (monthNum < 1 || monthNum > 12) {
            throw new Error(`Invalid month: ${month}`);
          }
          if (yearNum < 2020 || yearNum > 2100) {
            throw new Error(`Invalid year: ${year}`);
          }

          return new Date(yearNum, monthNum - 1, dayNum);
        }
        break;

      case 'agent-specific':
        // ISO format: YYYY-MM-DD
        dateMatch = content.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
          return new Date(dateMatch[0]);
        }
        break;
    }

    // Fallback: use file modification time
    console.warn('Could not parse date from content, using current date');
    return new Date();
  }

  /**
   * Extract participating agents from conversation
   */
  private extractParticipants(content: string, type: ConversationType): string[] {
    const agents = new Set<string>();

    // Known agent names
    const knownAgents = [
      'Claude',
      'CC',
      'Claude Code',
      'Manus',
      'Fred',
      'Penny',
      'Grok',
      'Gemini',
      'Callum',
      'Pete',
      'Colin',
      'Jan',
      'Notebook LM',
      'Fredo',
      'Noris',
    ];

    // Search for agent mentions
    for (const agent of knownAgents) {
      const pattern = new RegExp(`\\b${agent}\\b`, 'i');
      if (pattern.test(content)) {
        agents.add(agent);
      }
    }

    // Gemini CLI: Extract from command prompts
    if (type === 'gemini-cli') {
      agents.add('Gemini');
      // User is implicit participant
      agents.add('User');
    }

    // Claude GUI: Extract from conversation flow
    if (type === 'claude-gui') {
      agents.add('Claude');
      // User is implicit participant
      agents.add('User');
    }

    return Array.from(agents);
  }

  /**
   * Chunk content into manageable pieces by topic/section
   */
  private chunkByTopic(content: string): ConversationChunk[] {
    const chunks: ConversationChunk[] = [];

    // Split on markdown headers (## or ###) and double newlines
    const sections = content.split(/\n(?=#{2,3}\s)|(?:\n\n)+/);

    let currentChunk = '';
    let chunkIndex = 0;

    for (const section of sections) {
      const trimmedSection = section.trim();
      if (!trimmedSection) continue;

      // Estimate tokens (rough: 4 chars per token)
      const sectionTokens = trimmedSection.length / 4;

      // If adding this section would exceed chunk size, start new chunk
      if (currentChunk && (currentChunk.length + trimmedSection.length) / 4 > 4000) {
        chunks.push({
          index: chunkIndex++,
          content: currentChunk,
          tokenEstimate: currentChunk.length / 4,
        });
        currentChunk = '';
      }

      // Add section to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedSection;

      // If section is very large, flush immediately
      if (sectionTokens > 3000) {
        chunks.push({
          index: chunkIndex++,
          content: currentChunk,
          tokenEstimate: currentChunk.length / 4,
        });
        currentChunk = '';
      }
    }

    // Add remaining content
    if (currentChunk) {
      chunks.push({
        index: chunkIndex,
        content: currentChunk,
        tokenEstimate: currentChunk.length / 4,
      });
    }

    return chunks;
  }

  /**
   * Stream large files (>1MB) to avoid memory issues
   */
  async *parseFileStream(filePath: string): AsyncGenerator<ConversationChunk> {
    const stats = fs.statSync(filePath);

    // For small files, use regular parsing
    if (stats.size < 1 * 1024 * 1024) {
      const parsed = this.parseFile(filePath);
      for (const chunk of parsed.chunks) {
        yield chunk;
      }
      return;
    }

    // For large files, stream line by line
    const readStream = fs.createReadStream(filePath, {
      encoding: 'utf-8',
      highWaterMark: 64 * 1024, // 64KB chunks
    });

    let buffer = '';
    let chunkIndex = 0;

    for await (const chunk of readStream) {
      buffer += chunk;

      // Split on paragraph breaks
      const paragraphs = buffer.split(/\n\n+/);

      // Keep last incomplete paragraph in buffer
      buffer = paragraphs.pop() || '';

      // Yield complete paragraphs
      for (const para of paragraphs) {
        const trimmed = para.trim();
        if (trimmed.length > 100) {
          // Min chunk size
          yield {
            index: chunkIndex++,
            content: trimmed,
            tokenEstimate: trimmed.length / 4,
          };
        }
      }
    }

    // Yield remaining buffer
    if (buffer.trim().length > 100) {
      yield {
        index: chunkIndex,
        content: buffer.trim(),
        tokenEstimate: buffer.length / 4,
      };
    }
  }
}
