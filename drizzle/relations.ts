import { relations } from "drizzle-orm";
import {
  users,
  entities,
  relationships,
  semanticHistory
} from "./schema";

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  entities: many(entities),
  semanticHistoryChanges: many(semanticHistory),
}));

// Entity relations
export const entitiesRelations = relations(entities, ({ one, many }) => ({
  user: one(users, {
    fields: [entities.userId],
    references: [users.id],
  }),
  outgoingRelationships: many(relationships, { relationName: "fromEntity" }),
  incomingRelationships: many(relationships, { relationName: "toEntity" }),
  semanticHistory: many(semanticHistory),
}));

// Relationship relations
export const relationshipsRelations = relations(relationships, ({ one, many }) => ({
  fromEntity: one(entities, {
    fields: [relationships.fromEntityId],
    references: [entities.id],
    relationName: "fromEntity",
  }),
  toEntity: one(entities, {
    fields: [relationships.toEntityId],
    references: [entities.id],
    relationName: "toEntity",
  }),
  semanticHistory: many(semanticHistory),
}));

// Semantic History relations
export const semanticHistoryRelations = relations(semanticHistory, ({ one }) => ({
  entity: one(entities, {
    fields: [semanticHistory.entityId],
    references: [entities.id],
  }),
  relationship: one(relationships, {
    fields: [semanticHistory.relationshipId],
    references: [relationships.id],
  }),
  changedByUser: one(users, {
    fields: [semanticHistory.changedBy],
    references: [users.id],
  }),
}));
