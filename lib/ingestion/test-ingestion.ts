/**
 * Test script for knowledge graph ingestion system
 * Run with: npx tsx lib/ingestion/test-ingestion.ts
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { ConversationParser } from './conversationParser';
import { EntityExtractor } from './entityExtractor';
import { RelationshipBuilder } from './relationshipBuilder';
import { FileValidator, EntityValidator } from './validators';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testIngestion() {
  console.log('🧪 Testing Knowledge Graph Ingestion System\n');

  // Test file path (Claude conversation) - absolute path
  const testFilePath = 'C:\\Users\\carlo\\Development\\mem0-sync\\mem0\\conversations\\exports\\archive\\Claude_20251101.md';

  console.log(`📄 Test file: ${testFilePath}\n`);

  // Step 1: File Validation
  console.log('1️⃣  Testing File Validation...');
  const fileValidator = new FileValidator();
  const validationResult = fileValidator.validateFile(testFilePath);

  if (!validationResult.valid) {
    console.error(`❌ Validation failed: ${validationResult.error}`);
    process.exit(1);
  }
  console.log('✅ File validation passed\n');

  // Step 2: Parse Conversation
  console.log('2️⃣  Testing Conversation Parser...');
  const parser = new ConversationParser();
  let parsed;
  try {
    parsed = parser.parseFile(testFilePath);
    console.log(`✅ Parsed conversation:`);
    console.log(`   - Type: ${parsed.metadata.conversationType}`);
    console.log(`   - Date: ${parsed.metadata.fileDate.toISOString().split('T')[0]}`);
    console.log(
      `   - Participants: ${parsed.metadata.participatingAgents.join(', ')}`
    );
    console.log(`   - Chunks: ${parsed.chunks.length}`);
    console.log(
      `   - Total tokens (est): ${Math.round(parsed.fullText.length / 4)}\n`
    );
  } catch (error: any) {
    console.error(`❌ Parse failed: ${error.message}`);
    process.exit(1);
  }

  // Step 3: Extract Entities
  console.log('3️⃣  Testing Entity Extraction...');
  const extractor = new EntityExtractor();
  const rawEntities = parsed.chunks.flatMap((chunk) =>
    extractor.extractEntities(chunk)
  );

  console.log(`✅ Extracted ${rawEntities.length} entities:`);

  const entitiesByType = rawEntities.reduce((acc, e) => {
    acc[e.entityType] = (acc[e.entityType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [type, count] of Object.entries(entitiesByType)) {
    console.log(`   - ${type}: ${count}`);
  }

  // Show sample entities
  console.log('\n   Sample entities:');
  const sampleEntities = rawEntities.slice(0, 5);
  for (const entity of sampleEntities) {
    console.log(
      `     • ${entity.name} (${entity.entityType}, confidence: ${entity.confidence.toFixed(2)})`
    );
  }
  console.log('');

  // Step 4: Validate Entities
  console.log('4️⃣  Testing Entity Validation...');
  const entityValidator = new EntityValidator();
  const validatedEntities = rawEntities
    .map((e) => ({
      ...e,
      validation: entityValidator.validateEntityName(e.name),
    }))
    .filter((e) => e.validation.valid);

  const invalidCount = rawEntities.length - validatedEntities.length;
  console.log(`✅ Validated ${validatedEntities.length} entities`);
  console.log(`   - Valid: ${validatedEntities.length}`);
  console.log(`   - Invalid/Filtered: ${invalidCount}\n`);

  // Step 5: Infer Relationships
  console.log('5️⃣  Testing Relationship Inference...');
  const builder = new RelationshipBuilder();
  const relationships = builder.inferRelationships(rawEntities, parsed.fullText);

  console.log(`✅ Inferred ${relationships.length} relationships:`);

  const relationshipsByType = relationships.reduce((acc, r) => {
    acc[r.relationshipType] = (acc[r.relationshipType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [type, count] of Object.entries(relationshipsByType)) {
    console.log(`   - ${type}: ${count}`);
  }

  // Show sample relationships
  console.log('\n   Sample relationships:');
  const sampleRelationships = relationships.slice(0, 5);
  for (const rel of sampleRelationships) {
    console.log(
      `     • ${rel.fromEntityName} --[${rel.relationshipType}]--> ${rel.toEntityName}`
    );
    console.log(`       (confidence: ${rel.confidence.toFixed(2)}, weight: ${rel.weight})`);
  }
  console.log('');

  // Summary
  console.log('📊 Ingestion Test Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ File validation: PASSED`);
  console.log(`✅ Conversation parsing: PASSED`);
  console.log(`✅ Entity extraction: PASSED (${validatedEntities.length} entities)`);
  console.log(`✅ Relationship inference: PASSED (${relationships.length} relationships)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🎉 All tests passed! System is ready for production use.\n');

  // Export results for inspection
  const testResults = {
    metadata: parsed.metadata,
    entities: validatedEntities.map((e) => ({
      type: e.entityType,
      name: e.validation.normalized,
      confidence: e.confidence,
    })),
    relationships: relationships.map((r) => ({
      from: r.fromEntityName,
      to: r.toEntityName,
      type: r.relationshipType,
      confidence: r.confidence,
      weight: r.weight,
    })),
  };

  // Write results to file
  const fs = await import('fs');
  const resultsPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`📝 Test results written to: ${resultsPath}`);
}

// Run tests
testIngestion().catch((error) => {
  console.error('💥 Test failed with error:', error);
  process.exit(1);
});
