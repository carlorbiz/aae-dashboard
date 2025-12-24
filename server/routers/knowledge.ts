import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  entities,
  relationships,
  semanticHistory,
  type Entity,
  type Relationship,
  type SemanticHistory,
} from "../../drizzle/schema";
import { eq, and, or, like, desc, sql } from "drizzle-orm";
import { ConversationParser } from "../../lib/ingestion/conversationParser";
import { EntityExtractor } from "../../lib/ingestion/entityExtractor";
import { RelationshipBuilder } from "../../lib/ingestion/relationshipBuilder";
import { FileValidator, EntityValidator } from "../../lib/ingestion/validators";
import axios from "axios";

/**
 * Knowledge Graph Router - CRUD operations for entities and relationships
 * Implements semantic state pipeline (RAW → DRAFT → COOKED → CANONICAL)
 */

// Input validation schemas
const entityTypeEnum = z.enum([
  "Consulting",
  "ExecutiveAI",
  "Agents",
  "Content",
  "Technology",
  "ClientIntelligence",
]);

const semanticStateEnum = z.enum(["RAW", "DRAFT", "COOKED", "CANONICAL"]);

const createEntitySchema = z.object({
  entityType: entityTypeEnum,
  name: z.string().min(1).max(500),
  description: z.string().optional(),
  semanticState: semanticStateEnum.default("RAW"),
  properties: z.record(z.string(), z.any()).optional(),
  sourceType: z.string().max(100).optional(),
  sourceId: z.string().max(255).optional(),
  sourceUrl: z.string().max(1000).optional(),
});

const createRelationshipSchema = z.object({
  fromEntityId: z.number().positive(),
  toEntityId: z.number().positive(),
  relationshipType: z.string().min(1).max(100),
  weight: z.number().min(1).max(10).default(1),
  semanticState: semanticStateEnum.default("RAW"),
  properties: z.record(z.string(), z.any()).optional(),
});

const promoteSemanticStateSchema = z.object({
  entityId: z.number().positive().optional(),
  relationshipId: z.number().positive().optional(),
  targetState: semanticStateEnum,
  reason: z.string().optional(),
});

export const knowledgeRouter = router({
  /**
   * Create a new entity in the knowledge graph
   */
  createEntity: protectedProcedure
    .input(createEntitySchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = ctx.user?.id || 1;

      const result = await db.insert(entities).values({
        userId,
        ...input,
      });

      return {
        success: true,
        entityId: result[0].insertId,
        message: "Entity created successfully",
      };
    }),

  /**
   * Get entity by ID with related entities
   */
  getEntity: publicProcedure
    .input(z.object({ id: z.number().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const entityResult = await db
        .select()
        .from(entities)
        .where(eq(entities.id, input.id))
        .limit(1);

      if (entityResult.length === 0) {
        throw new Error("Entity not found");
      }

      const entity = entityResult[0];

      // Get outgoing relationships
      const outgoing = await db
        .select({
          relationshipId: relationships.id,
          relationshipType: relationships.relationshipType,
          weight: relationships.weight,
          toEntity: entities,
        })
        .from(relationships)
        .innerJoin(entities, eq(relationships.toEntityId, entities.id))
        .where(eq(relationships.fromEntityId, input.id));

      // Get incoming relationships
      const incoming = await db
        .select({
          relationshipId: relationships.id,
          relationshipType: relationships.relationshipType,
          weight: relationships.weight,
          fromEntity: entities,
        })
        .from(relationships)
        .innerJoin(entities, eq(relationships.fromEntityId, entities.id))
        .where(eq(relationships.toEntityId, input.id));

      return {
        entity,
        outgoing,
        incoming,
      };
    }),

  /**
   * List entities with filters
   */
  listEntities: protectedProcedure
    .input(
      z.object({
        entityType: entityTypeEnum.optional(),
        semanticState: semanticStateEnum.optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = ctx.user?.id || 1;

      let conditions: any[] = [eq(entities.userId, userId)];

      // Apply filters
      if (input.entityType) {
        conditions.push(eq(entities.entityType, input.entityType));
      }

      if (input.semanticState) {
        conditions.push(eq(entities.semanticState, input.semanticState));
      }

      if (input.search) {
        conditions.push(
          or(
            like(entities.name, `%${input.search}%`),
            like(entities.description, `%${input.search}%`)
          )
        );
      }

      const results = await db
        .select()
        .from(entities)
        .where(and(...conditions))
        .orderBy(desc(entities.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(entities)
        .where(eq(entities.userId, userId));

      const count = countResult[0]?.count || 0;

      return {
        entities: results,
        total: count,
        hasMore: input.offset + input.limit < count,
      };
    }),

  /**
   * Create a relationship between two entities
   */
  createRelationship: protectedProcedure
    .input(createRelationshipSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify both entities exist
      const fromEntityResult = await db
        .select()
        .from(entities)
        .where(eq(entities.id, input.fromEntityId))
        .limit(1);

      const toEntityResult = await db
        .select()
        .from(entities)
        .where(eq(entities.id, input.toEntityId))
        .limit(1);

      if (fromEntityResult.length === 0 || toEntityResult.length === 0) {
        throw new Error("One or both entities not found");
      }

      const result = await db.insert(relationships).values(input);

      return {
        success: true,
        relationshipId: result[0].insertId,
        message: "Relationship created successfully",
      };
    }),

  /**
   * Get related entities (traverse relationships)
   */
  getRelatedEntities: publicProcedure
    .input(
      z.object({
        entityId: z.number().positive(),
        depth: z.number().min(1).max(3).default(1),
        relationshipType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // For now, implement depth=1 traversal
      // TODO: Implement recursive traversal for depth > 1

      const outgoing = await db
        .select({
          relationship: relationships,
          entity: entities,
        })
        .from(relationships)
        .innerJoin(entities, eq(relationships.toEntityId, entities.id))
        .where(eq(relationships.fromEntityId, input.entityId));

      const incoming = await db
        .select({
          relationship: relationships,
          entity: entities,
        })
        .from(relationships)
        .innerJoin(entities, eq(relationships.fromEntityId, entities.id))
        .where(eq(relationships.toEntityId, input.entityId));

      return {
        outgoing,
        incoming,
      };
    }),

  /**
   * Promote entity or relationship through semantic pipeline
   * RAW → DRAFT → COOKED → CANONICAL
   * Only Carla (or admin users) can promote to CANONICAL
   */
  promoteSemanticState: protectedProcedure
    .input(promoteSemanticStateSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = ctx.user?.id || 1;
      const userRole = ctx.user?.role || "user";

      // Validate state transition
      const stateOrder = ["RAW", "DRAFT", "COOKED", "CANONICAL"] as const;
      const targetIndex = stateOrder.indexOf(input.targetState);

      // Only admins (Carla) can promote to CANONICAL
      if (input.targetState === "CANONICAL" && userRole !== "admin") {
        throw new Error("Only administrators can promote to CANONICAL state");
      }

      if (input.entityId) {
        // Promote entity
        const entityResult = await db
          .select()
          .from(entities)
          .where(eq(entities.id, input.entityId))
          .limit(1);

        if (entityResult.length === 0) {
          throw new Error("Entity not found");
        }

        const entity = entityResult[0];
        const currentIndex = stateOrder.indexOf(entity.semanticState);

        // Can only promote forward, not backward
        if (targetIndex <= currentIndex) {
          throw new Error(
            "Cannot demote or stay at same semantic state. Current: " +
              entity.semanticState
          );
        }

        // Update entity
        await db
          .update(entities)
          .set({ semanticState: input.targetState })
          .where(eq(entities.id, input.entityId));

        // Log to semantic history
        await db.insert(semanticHistory).values({
          entityId: input.entityId,
          previousState: entity.semanticState,
          newState: input.targetState,
          changedBy: userId,
          reason: input.reason,
        });

        return {
          success: true,
          message: `Entity promoted from ${entity.semanticState} to ${input.targetState}`,
        };
      } else if (input.relationshipId) {
        // Promote relationship
        const relationshipResult = await db
          .select()
          .from(relationships)
          .where(eq(relationships.id, input.relationshipId))
          .limit(1);

        if (relationshipResult.length === 0) {
          throw new Error("Relationship not found");
        }

        const relationship = relationshipResult[0];
        const currentIndex = stateOrder.indexOf(relationship.semanticState);

        if (targetIndex <= currentIndex) {
          throw new Error(
            "Cannot demote or stay at same semantic state. Current: " +
              relationship.semanticState
          );
        }

        await db
          .update(relationships)
          .set({ semanticState: input.targetState })
          .where(eq(relationships.id, input.relationshipId));

        await db.insert(semanticHistory).values({
          relationshipId: input.relationshipId,
          previousState: relationship.semanticState,
          newState: input.targetState,
          changedBy: userId,
          reason: input.reason,
        });

        return {
          success: true,
          message: `Relationship promoted from ${relationship.semanticState} to ${input.targetState}`,
        };
      } else {
        throw new Error("Either entityId or relationshipId must be provided");
      }
    }),

  /**
   * Get semantic history for an entity or relationship
   */
  getSemanticHistory: publicProcedure
    .input(
      z.object({
        entityId: z.number().positive().optional(),
        relationshipId: z.number().positive().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (!input.entityId && !input.relationshipId) {
        throw new Error("Either entityId or relationshipId must be provided");
      }

      let conditions: any[] = [];

      if (input.entityId) {
        conditions.push(eq(semanticHistory.entityId, input.entityId));
      }
      if (input.relationshipId) {
        conditions.push(eq(semanticHistory.relationshipId, input.relationshipId));
      }

      const history = await db
        .select()
        .from(semanticHistory)
        .where(or(...conditions))
        .orderBy(desc(semanticHistory.createdAt));

      return { history };
    }),

  /**
   * Search entities across the knowledge graph
   */
  searchEntities: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        entityTypes: z.array(entityTypeEnum).optional(),
        semanticStates: z.array(semanticStateEnum).optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = ctx.user?.id || 1;

      let conditions: any[] = [
        eq(entities.userId, userId),
        or(
          like(entities.name, `%${input.query}%`),
          like(entities.description, `%${input.query}%`)
        )!,
      ];

      if (input.entityTypes && input.entityTypes.length > 0) {
        conditions.push(
          or(...input.entityTypes.map((type) => eq(entities.entityType, type)))!
        );
      }

      if (input.semanticStates && input.semanticStates.length > 0) {
        conditions.push(
          or(...input.semanticStates.map((state) => eq(entities.semanticState, state)))!
        );
      }

      const results = await db
        .select()
        .from(entities)
        .where(and(...conditions))
        .orderBy(desc(entities.updatedAt))
        .limit(input.limit);

      return { results };
    }),

  /**
   * Ingest conversation file into knowledge graph
   */
  ingestConversation: protectedProcedure
    .input(
      z.object({
        filePath: z.string().min(1),
        dryRun: z.boolean().default(false),
        autoPromote: z.boolean().default(false),
        forceReingest: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = ctx.user?.id || 1;

      try {
        // 1. Validation phase
        const fileValidator = new FileValidator();
        const validationResult = fileValidator.validateFile(input.filePath);

        if (!validationResult.valid) {
          return {
            success: false,
            message: `Validation failed: ${validationResult.error}`,
            error: {
              stage: 'validation' as const,
              code: 'FILE_VALIDATION_ERROR',
              message: validationResult.error || 'Unknown validation error',
            },
          };
        }

        // 2. Check for duplicate ingestion
        const existingConversation = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.entityType, 'Content'),
              eq(entities.sourceId, input.filePath)
            )
          )
          .limit(1);

        if (existingConversation.length > 0 && !input.forceReingest) {
          return {
            success: false,
            alreadyIngested: true,
            message:
              'Conversation already ingested. Use forceReingest=true to override.',
          };
        }

        if (input.forceReingest && existingConversation.length > 0) {
          // Delete old entities from this conversation
          await db
            .delete(entities)
            .where(eq(entities.sourceId, input.filePath));
        }

        // 3. Parse phase
        const parser = new ConversationParser();
        let parsed;
        try {
          parsed = parser.parseFile(input.filePath);
        } catch (parseError: any) {
          return {
            success: false,
            message: `Parse failed: ${parseError.message}`,
            error: {
              stage: 'parse' as const,
              code: 'PARSE_ERROR',
              message: parseError.message,
            },
          };
        }

        // 4. Extract entities phase
        const extractor = new EntityExtractor();
        const rawEntities = parsed.chunks.flatMap((chunk) =>
          extractor.extractEntities(chunk)
        );

        // 5. Validation & deduplication phase
        const entityValidator = new EntityValidator();
        const existingEntities = await db.select().from(entities);

        interface ValidatedEntity {
          entityType: string;
          name: string;
          description: string;
          confidence: number;
          sourceContext: string;
          normalized: string;
          valid: boolean;
          existingEntity: Entity | null;
        }

        const validatedEntities: ValidatedEntity[] = rawEntities
          .map((e) => {
            const validation = entityValidator.validateEntityName(e.name);
            return {
              ...e,
              normalized: validation.normalized,
              valid: validation.valid,
              existingEntity: entityValidator.detectDuplicates(
                validation.normalized,
                existingEntities
              ),
            };
          })
          .filter((e) => e.valid);

        // If dry run, return preview
        if (input.dryRun) {
          const builder = new RelationshipBuilder();
          const relationships = builder.inferRelationships(
            rawEntities,
            parsed.fullText
          );

          return {
            success: true,
            preview: {
              entities: rawEntities,
              relationships,
            },
            wouldCreate: validatedEntities.filter((e) => !e.existingEntity)
              .length,
            wouldSkip: validatedEntities.filter((e) => e.existingEntity).length,
            wouldRelate: relationships.length,
            message: 'Dry run complete - no changes made to database',
          };
        }

        // 6. Insert new entities
        const newEntities = validatedEntities.filter((e) => !e.existingEntity);
        const insertedEntities: Array<Entity & { insertId: number }> = [];

        for (const entity of newEntities) {
          const now = new Date();
          const result = await db.insert(entities).values({
            userId,
            entityType: entity.entityType as any,
            name: entity.normalized,
            description: entity.description,
            semanticState: input.autoPromote ? 'DRAFT' : 'RAW',
            properties: {
              confidence: entity.confidence,
              sourceContext: entity.sourceContext,
            },
            sourceType: 'conversation',
            sourceId: input.filePath,
            sourceUrl: input.filePath,
            createdAt: now,
            updatedAt: now,
          }).returning();

          // Store with ID for relationship creation
          insertedEntities.push({
            ...entity,
            id: result[0].id,
            userId,
            createdAt: now,
            updatedAt: now,
          } as Entity & { insertId: number });
        }

        // Build entity name → ID map
        const entityIdMap = new Map<string, number>();
        for (const e of insertedEntities) {
          entityIdMap.set(e.name.toLowerCase(), e.id);
        }
        for (const e of validatedEntities.filter((e) => e.existingEntity)) {
          entityIdMap.set(
            e.normalized.toLowerCase(),
            e.existingEntity!.id
          );
        }

        // 7. Infer and create relationships
        const builder = new RelationshipBuilder();
        const inferredRelationships = builder.inferRelationships(
          validatedEntities.map((e) => ({
            entityType: e.entityType as any,
            name: e.normalized,
            description: e.description,
            confidence: e.confidence,
            sourceContext: e.sourceContext,
          })),
          parsed.fullText
        );

        const insertedRelationships = [];
        for (const rel of inferredRelationships) {
          const fromId = entityIdMap.get(rel.fromEntityName.toLowerCase());
          const toId = entityIdMap.get(rel.toEntityName.toLowerCase());

          if (fromId && toId) {
            try {
              const now = new Date();
              await db.insert(relationships).values({
                fromEntityId: fromId,
                toEntityId: toId,
                relationshipType: rel.relationshipType,
                weight: rel.weight,
                semanticState: input.autoPromote ? 'DRAFT' : 'RAW',
                properties: {
                  confidence: rel.confidence,
                  sourceContext: rel.sourceContext,
                },
                createdAt: now,
                updatedAt: now,
              });
              insertedRelationships.push(rel);
            } catch (fkError: any) {
              console.warn(
                `Skipped relationship due to error: ${fkError.message}`
              );
            }
          }
        }

        // 8. Dual-write to Knowledge Lake API
        const knowledgeLakeUrl = process.env.KNOWLEDGE_LAKE_URL || 'https://knowledge-lake-api-production.up.railway.app';
        let knowledgeLakeIngested = false;

        try {
          await axios.post(`${knowledgeLakeUrl}/api/conversations`, {
            userId,
            topic: parsed.metadata?.title || `Conversation from ${input.filePath}`,
            content: parsed.fullText,
            conversationDate: parsed.metadata?.date || new Date().toISOString().split('T')[0],
            entities: validatedEntities.map(e => ({
              name: e.normalized,
              entityType: e.entityType,
              confidence: e.confidence,
              description: e.description,
              sourceContext: e.sourceContext,
            })),
            relationships: inferredRelationships.map(r => ({
              from: r.fromEntityName,
              to: r.toEntityName,
              relationshipType: r.relationshipType,
              weight: r.weight,
              confidence: r.confidence,
            })),
            metadata: {
              agent: 'AAE Dashboard',
              source: 'manual_ingestion',
              filePath: input.filePath,
              wordCount: parsed.fullText.split(/\s+/).length,
            },
          });
          knowledgeLakeIngested = true;
          console.log('[Knowledge Lake] Successfully ingested conversation to Knowledge Lake');
        } catch (knowledgeLakeError: any) {
          console.warn('[Knowledge Lake] Dual-write to Knowledge Lake failed:', knowledgeLakeError.message);
          // Continue anyway - local write succeeded
        }

        return {
          success: true,
          entitiesCreated: insertedEntities.length,
          entitiesSkipped: validatedEntities.filter((e) => e.existingEntity)
            .length,
          relationshipsCreated: insertedRelationships.length,
          knowledgeLakeIngested,
          message: `Ingested ${insertedEntities.length} new entities and ${insertedRelationships.length} relationships from conversation${knowledgeLakeIngested ? ' (synced to Knowledge Lake)' : ''}`,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Ingestion failed: ${error.message}`,
          error: {
            stage: 'insert' as const,
            code: 'DATABASE_ERROR',
            message: error.message,
          },
        };
      }
    }),

  /**
   * Get conversations from Knowledge Lake API
   */
  getConversations: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        agent: z.string().optional(),
        entityType: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id || 1;
      const knowledgeLakeUrl = process.env.KNOWLEDGE_LAKE_URL || 'https://knowledge-lake-api-production.up.railway.app';

      try {
        // Use POST /api/query endpoint (Knowledge Lake API 2.1.0)
        const response = await axios.post(`${knowledgeLakeUrl}/api/query`, {
          userId: userId,
          query: input.query || '',
          limit: input.limit,
        });

        return {
          success: true,
          conversations: response.data.results || [],
          total: response.data.results?.length || 0,
          filters: {},
        };
      } catch (error: any) {
        console.error('[Knowledge Lake] Error fetching conversations:', error.message);
        return {
          success: false,
          conversations: [],
          total: 0,
          error: error.message,
        };
      }
    }),

  /**
   * Get Knowledge Lake statistics
   */
  getKnowledgeLakeStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id || 1;
      const knowledgeLakeUrl = process.env.KNOWLEDGE_LAKE_URL || 'https://knowledge-lake-api-production.up.railway.app';

      try {
        const response = await axios.get(`${knowledgeLakeUrl}/api/stats?userId=${userId}`);
        return {
          success: true,
          ...response.data,
        };
      } catch (error: any) {
        console.error('[Knowledge Lake] Error fetching stats:', error.message);
        return {
          success: false,
          totalConversations: 0,
          totalEntities: 0,
          totalRelationships: 0,
          error: error.message,
        };
      }
    }),
});
