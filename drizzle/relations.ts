import { relations } from "drizzle-orm";
import {
  users,
  entities,
  relationships,
  semanticHistory,
  projects,
  healthChecks,
  incidents
} from "./schema";

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  entities: many(entities),
  semanticHistoryChanges: many(semanticHistory),
  projects: many(projects),
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

// Project relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  healthChecks: many(healthChecks),
  incidents: many(incidents),
}));

// Health Check relations
export const healthChecksRelations = relations(healthChecks, ({ one }) => ({
  project: one(projects, {
    fields: [healthChecks.projectId],
    references: [projects.id],
  }),
}));

// Incident relations
export const incidentsRelations = relations(incidents, ({ one }) => ({
  project: one(projects, {
    fields: [incidents.projectId],
    references: [projects.id],
  }),
  relatedHealthCheck: one(healthChecks, {
    fields: [incidents.relatedHealthCheckId],
    references: [healthChecks.id],
  }),
}));
