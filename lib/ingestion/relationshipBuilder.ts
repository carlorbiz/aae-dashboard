/**
 * Relationship Builder - Infers relationships between entities from context
 */

import type { ExtractedEntity, InferredRelationship } from './types';

export class RelationshipBuilder {
  /**
   * Infer relationships between entities based on conversation context
   */
  inferRelationships(
    entities: ExtractedEntity[],
    context: string
  ): InferredRelationship[] {
    const relationships: InferredRelationship[] = [];

    // Build entity lookup map for quick access
    const entityMap = new Map<string, ExtractedEntity>();
    for (const entity of entities) {
      entityMap.set(entity.name.toLowerCase(), entity);
    }

    // Apply relationship detection patterns
    relationships.push(...this.detectUsagePatterns(entities, context));
    relationships.push(...this.detectCollaborationPatterns(entities, context));
    relationships.push(...this.detectIntegrationPatterns(entities, context));
    relationships.push(...this.detectOwnershipPatterns(entities, context));

    // Deduplicate and score
    return this.deduplicateRelationships(relationships);
  }

  /**
   * Detect "uses" relationships (Agent uses Technology, Project uses Technology)
   */
  private detectUsagePatterns(
    entities: ExtractedEntity[],
    context: string
  ): InferredRelationship[] {
    const relationships: InferredRelationship[] = [];

    const agents = entities.filter((e) => e.entityType === 'Agents');
    const technologies = entities.filter((e) => e.entityType === 'Technology');
    const projects = entities.filter((e) => e.entityType === 'ExecutiveAI');

    // Pattern: "[Agent] used/uses/configured/implemented [Technology]"
    const usageVerbs = [
      'used',
      'uses',
      'configured',
      'implemented',
      'built with',
      'leveraged',
      'integrated',
    ];

    for (const agent of agents) {
      for (const tech of technologies) {
        for (const verb of usageVerbs) {
          const pattern = new RegExp(
            `${this.escapeRegex(agent.name)}[\\s\\S]{0,50}${verb}[\\s\\S]{0,50}${this.escapeRegex(tech.name)}`,
            'gi'
          );

          const match = pattern.exec(context);
          if (match) {
            relationships.push({
              fromEntityName: agent.name,
              toEntityName: tech.name,
              relationshipType: 'agent_uses_technology',
              confidence: 0.85,
              weight: 8,
              sourceContext: match[0],
            });
          }
        }
      }
    }

    // Pattern: "[Project] uses/integrates [Technology]"
    for (const project of projects) {
      for (const tech of technologies) {
        for (const verb of usageVerbs) {
          const pattern = new RegExp(
            `${this.escapeRegex(project.name)}[\\s\\S]{0,50}${verb}[\\s\\S]{0,50}${this.escapeRegex(tech.name)}`,
            'gi'
          );

          const match = pattern.exec(context);
          if (match) {
            relationships.push({
              fromEntityName: project.name,
              toEntityName: tech.name,
              relationshipType: 'project_uses_technology',
              confidence: 0.8,
              weight: 7,
              sourceContext: match[0],
            });
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Detect collaboration patterns (Agent works with Agent, Agent works on Project)
   */
  private detectCollaborationPatterns(
    entities: ExtractedEntity[],
    context: string
  ): InferredRelationship[] {
    const relationships: InferredRelationship[] = [];

    const agents = entities.filter((e) => e.entityType === 'Agents');
    const projects = entities.filter((e) => e.entityType === 'ExecutiveAI');

    // Pattern: "[Agent] and [Agent] worked together"
    const collaborationWords = ['and', 'with', 'alongside', 'coordinated with'];

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const agent1 = agents[i];
        const agent2 = agents[j];

        for (const word of collaborationWords) {
          const pattern = new RegExp(
            `${this.escapeRegex(agent1.name)}[\\s\\S]{0,30}${word}[\\s\\S]{0,30}${this.escapeRegex(agent2.name)}`,
            'gi'
          );

          const match = pattern.exec(context);
          if (match) {
            relationships.push({
              fromEntityName: agent1.name,
              toEntityName: agent2.name,
              relationshipType: 'agent_collaborates_with_agent',
              confidence: 0.75,
              weight: 6,
              sourceContext: match[0],
            });
          }
        }
      }
    }

    // Pattern: "[Agent] works on [Project]"
    const workVerbs = ['works on', 'working on', 'developed', 'built', 'implemented'];

    for (const agent of agents) {
      for (const project of projects) {
        for (const verb of workVerbs) {
          const pattern = new RegExp(
            `${this.escapeRegex(agent.name)}[\\s\\S]{0,50}${verb}[\\s\\S]{0,50}${this.escapeRegex(project.name)}`,
            'gi'
          );

          const match = pattern.exec(context);
          if (match) {
            relationships.push({
              fromEntityName: agent.name,
              toEntityName: project.name,
              relationshipType: 'agent_works_on_project',
              confidence: 0.8,
              weight: 7,
              sourceContext: match[0],
            });
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Detect technology integration patterns
   */
  private detectIntegrationPatterns(
    entities: ExtractedEntity[],
    context: string
  ): InferredRelationship[] {
    const relationships: InferredRelationship[] = [];

    const technologies = entities.filter((e) => e.entityType === 'Technology');

    // Pattern: "[Tech A] integrates with/connects to [Tech B]"
    const integrationVerbs = [
      'integrates with',
      'connects to',
      'syncs with',
      'interfaces with',
      'bridges to',
    ];

    for (let i = 0; i < technologies.length; i++) {
      for (let j = 0; j < technologies.length; j++) {
        if (i === j) continue;

        const tech1 = technologies[i];
        const tech2 = technologies[j];

        for (const verb of integrationVerbs) {
          const pattern = new RegExp(
            `${this.escapeRegex(tech1.name)}[\\s\\S]{0,50}${verb}[\\s\\S]{0,50}${this.escapeRegex(tech2.name)}`,
            'gi'
          );

          const match = pattern.exec(context);
          if (match) {
            relationships.push({
              fromEntityName: tech1.name,
              toEntityName: tech2.name,
              relationshipType: 'technology_integrates_technology',
              confidence: 0.85,
              weight: 8,
              sourceContext: match[0],
            });
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Detect ownership/creation patterns
   */
  private detectOwnershipPatterns(
    entities: ExtractedEntity[],
    context: string
  ): InferredRelationship[] {
    const relationships: InferredRelationship[] = [];

    const agents = entities.filter((e) => e.entityType === 'Agents');
    const projects = entities.filter((e) => e.entityType === 'ExecutiveAI');
    const consultingWork = entities.filter((e) => e.entityType === 'Consulting');

    // Pattern: "[Agent] created/built/designed [Project]"
    const creationVerbs = ['created', 'built', 'designed', 'developed', 'architected'];

    for (const agent of agents) {
      for (const project of projects) {
        for (const verb of creationVerbs) {
          const pattern = new RegExp(
            `${this.escapeRegex(agent.name)}[\\s\\S]{0,50}${verb}[\\s\\S]{0,50}${this.escapeRegex(project.name)}`,
            'gi'
          );

          const match = pattern.exec(context);
          if (match) {
            relationships.push({
              fromEntityName: agent.name,
              toEntityName: project.name,
              relationshipType: 'agent_created_project',
              confidence: 0.8,
              weight: 7,
              sourceContext: match[0],
            });
          }
        }
      }
    }

    // Pattern: Project delivers Consulting Work
    for (const project of projects) {
      for (const work of consultingWork) {
        const pattern = new RegExp(
          `${this.escapeRegex(project.name)}[\\s\\S]{0,50}(delivers|produces|creates)[\\s\\S]{0,50}${this.escapeRegex(work.name)}`,
          'gi'
        );

        const match = pattern.exec(context);
        if (match) {
          relationships.push({
            fromEntityName: project.name,
            toEntityName: work.name,
            relationshipType: 'project_delivers_work',
            confidence: 0.75,
            weight: 6,
            sourceContext: match[0],
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Deduplicate relationships and keep highest confidence
   */
  private deduplicateRelationships(
    relationships: InferredRelationship[]
  ): InferredRelationship[] {
    const seen = new Map<string, InferredRelationship>();

    for (const rel of relationships) {
      const key = `${rel.fromEntityName}:${rel.relationshipType}:${rel.toEntityName}`;

      if (!seen.has(key)) {
        seen.set(key, rel);
      } else {
        const existing = seen.get(key)!;
        if (rel.confidence > existing.confidence) {
          seen.set(key, rel);
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
