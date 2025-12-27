/**
 * Migration Runner: Add Gamma and DocsAutomator to Platform Enum
 *
 * Executes the platform enum migration to add 'gamma' and 'docsautomator' values
 *
 * Usage:
 *   npm run migrate:platforms
 * or:
 *   ts-node scripts/run-platform-migration.ts
 */

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const migrationSQL = `
-- Migration: Add Gamma and DocsAutomator to platform enum
-- Date: 2025-12-27

-- Add new values to the platform enum
ALTER TYPE platform ADD VALUE IF NOT EXISTS 'gamma';
ALTER TYPE platform ADD VALUE IF NOT EXISTS 'docsautomator';
`;

async function runMigration() {
  console.log('\n🔄 Running platform enum migration...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Test connection
    console.log('📡 Connecting to database...');
    const client = await pool.connect();

    // Check current enum values
    console.log('\n📊 Current platform enum values:');
    const currentEnums = await client.query(`
      SELECT unnest(enum_range(NULL::platform))::text AS platform_value
      ORDER BY platform_value;
    `);
    currentEnums.rows.forEach(row => {
      console.log(`   - ${row.platform_value}`);
    });

    // Check if gamma and docsautomator already exist
    const hasGamma = currentEnums.rows.some(row => row.platform_value === 'gamma');
    const hasDocsAutomator = currentEnums.rows.some(row => row.platform_value === 'docsautomator');

    if (hasGamma && hasDocsAutomator) {
      console.log('\n✅ Migration already applied - gamma and docsautomator values exist');
      client.release();
      await pool.end();
      return;
    }

    // Run migration
    console.log('\n🔨 Applying migration...');
    await client.query(migrationSQL);

    // Verify migration
    console.log('\n✅ Migration successful!');
    console.log('\n📊 Updated platform enum values:');
    const updatedEnums = await client.query(`
      SELECT unnest(enum_range(NULL::platform))::text AS platform_value
      ORDER BY platform_value;
    `);
    updatedEnums.rows.forEach(row => {
      console.log(`   - ${row.platform_value}`);
    });

    client.release();
    await pool.end();

    console.log('\n✨ Platform migration complete!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

// Auto-run when executed directly
runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
