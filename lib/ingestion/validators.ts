/**
 * Validators - Input validation for file and entity data
 */

import fs from 'fs';
import type { ValidationResult, EntityNameValidation } from './types';
import type { Entity } from '../../drizzle/schema';

export class FileValidator {
  /**
   * Validate conversation file before parsing
   */
  validateFile(filePath: string): ValidationResult {
    // Check 1: File exists and is readable
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'File not found' };
    }

    let stats;
    try {
      stats = fs.statSync(filePath);
    } catch (err) {
      return { valid: false, error: 'File is not accessible' };
    }

    // Check 2: File size reasonable (< 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (stats.size > maxSize) {
      return {
        valid: false,
        error: `File too large (${Math.round(stats.size / 1024 / 1024)}MB). Maximum: 10MB`,
      };
    }

    if (stats.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    // Check 3: Valid text encoding (UTF-8)
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      return { valid: false, error: 'Invalid UTF-8 encoding or file is binary' };
    }

    // Check 4: Markdown format indicators
    const hasDateHeader =
      /\d{2}\/\d{2}\/\d{4}/.test(content) || /\d{4}-\d{2}-\d{2}/.test(content);
    const hasMarkdown = /^#{1,6}\s/m.test(content);

    if (!hasDateHeader && !hasMarkdown) {
      return {
        valid: false,
        error: 'Not a recognized conversation format (missing date header or markdown)',
        warnings: ['File may not be a valid conversation export'],
      };
    }

    return { valid: true };
  }
}

export class EntityValidator {
  /**
   * Validate and normalize entity name
   */
  validateEntityName(name: string): EntityNameValidation {
    // Remove excessive whitespace
    const normalized = name.trim().replace(/\s+/g, ' ');

    // Length constraints (schema: max 500 chars, min 1)
    if (normalized.length === 0) {
      return { valid: false, normalized, warnings: ['Empty entity name'] };
    }

    if (normalized.length > 500) {
      return {
        valid: false,
        normalized: normalized.slice(0, 500),
        warnings: ['Entity name too long (>500 chars), truncated'],
      };
    }

    // Reject pure punctuation or numbers
    if (/^[\d\s\p{P}]+$/u.test(normalized)) {
      return {
        valid: false,
        normalized,
        warnings: ['Entity name contains only punctuation or numbers'],
      };
    }

    // Reject common non-entities (stopwords)
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
    ];

    if (stopWords.includes(normalized.toLowerCase())) {
      return {
        valid: false,
        normalized,
        warnings: ['Entity name is a common stopword'],
      };
    }

    // Warn if name is very short (might be abbreviation/noise)
    if (normalized.length < 2) {
      return {
        valid: true,
        normalized,
        warnings: ['Entity name is very short (1 char)'],
      };
    }

    return { valid: true, normalized };
  }

  /**
   * Detect duplicate entities using fuzzy matching
   */
  detectDuplicates(name: string, existingEntities: Entity[]): Entity | null {
    const normalizedName = name.toLowerCase().trim();

    // Exact match (case-insensitive)
    const exactMatch = existingEntities.find(
      (e) => e.name.toLowerCase() === normalizedName
    );
    if (exactMatch) return exactMatch;

    // Fuzzy match using Levenshtein distance
    // "Claude Code" ~= "Claude-Code" ~= "ClaudeCode"
    const strippedName = normalizedName.replace(/[\s-_]/g, '');

    for (const entity of existingEntities) {
      const strippedExisting = entity.name.toLowerCase().replace(/[\s-_]/g, '');

      const distance = this.levenshteinDistance(strippedName, strippedExisting);
      const maxLength = Math.max(strippedName.length, strippedExisting.length);
      const similarity = 1 - distance / maxLength;

      if (similarity > 0.85) {
        // 85% similar
        return entity;
      }
    }

    return null;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create distance matrix
    const matrix: number[][] = [];

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }
}
