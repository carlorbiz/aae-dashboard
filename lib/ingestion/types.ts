/**
 * Type definitions for knowledge graph ingestion system
 */

export type ConversationType = 'claude-gui' | 'gemini-cli' | 'agent-specific' | 'unknown';

export type EntityType =
  | 'Consulting'
  | 'ExecutiveAI'
  | 'Agents'
  | 'Content'
  | 'Technology'
  | 'ClientIntelligence';

export type SemanticState = 'RAW' | 'DRAFT' | 'COOKED' | 'CANONICAL';

/**
 * Metadata extracted from conversation file
 */
export interface ConversationMetadata {
  filePath: string;
  fileDate: Date;
  conversationType: ConversationType;
  participatingAgents: string[];
  fileSize: number;
}

/**
 * A logical chunk of conversation content
 */
export interface ConversationChunk {
  index: number;
  content: string;
  tokenEstimate: number;
  speaker?: string;
  timestamp?: Date;
}

/**
 * Parsed conversation with metadata and chunked content
 */
export interface ParsedConversation {
  metadata: ConversationMetadata;
  fullText: string;
  chunks: ConversationChunk[];
}

/**
 * Entity extracted from conversation
 */
export interface ExtractedEntity {
  entityType: EntityType;
  name: string;
  description: string;
  confidence: number; // 0-1 scoring
  sourceContext: string; // Surrounding text for reference
}

/**
 * Relationship inferred between entities
 */
export interface InferredRelationship {
  fromEntityName: string;
  toEntityName: string;
  relationshipType: string;
  confidence: number; // 0-1 scoring
  weight: number; // 1-10 for database
  sourceContext: string;
}

/**
 * Validation result for file input
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Entity name validation and normalization result
 */
export interface EntityNameValidation {
  valid: boolean;
  normalized: string;
  warnings?: string[];
}

/**
 * Ingestion error with detailed context
 */
export interface IngestionError {
  stage: 'validation' | 'parse' | 'extract' | 'insert';
  code: string;
  message: string;
  line?: number;
  context?: string;
  suggestion?: string;
}

/**
 * Result of ingestion operation
 */
export interface IngestionResult {
  success: boolean;
  entitiesCreated?: number;
  entitiesSkipped?: number;
  relationshipsCreated?: number;
  message: string;
  error?: IngestionError;
  preview?: {
    entities: ExtractedEntity[];
    relationships: InferredRelationship[];
  };
}

/**
 * Entity with database ID (after insertion)
 */
export interface EntityWithId extends ExtractedEntity {
  id: number;
  userId: number;
}
