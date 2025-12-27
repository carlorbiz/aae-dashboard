/**
 * Database Initialization Script
 *
 * Initializes the AAE Dashboard database with base schema
 *
 * Usage:
 *   npm run db:init
 */

import pg from "pg";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const { Pool } = pg;

async function initDatabase() {
  console.log('\n🏗️  Initializing AAE Dashboard database...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('📡 Connecting to database...');
    const client = await pool.connect();

    // Check if database is already initialized
    console.log('\n🔍 Checking if database is initialized...');
    const checkTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'users';
    `);

    if (checkTables.rows.length > 0) {
      console.log('✅ Database already initialized (users table exists)');
      client.release();
      await pool.end();
      return;
    }

    // Run base migration
    console.log('\n📦 Running base migration (0000_material_meteorite.sql)...');
    const baseMigrationPath = join(__dirname, '..', 'drizzle', '0000_material_meteorite.sql');
    const baseMigrationSQL = readFileSync(baseMigrationPath, 'utf-8');

    // Split by statement-breakpoint and execute each statement
    const statements = baseMigrationSQL
      .split('-->').join('')
      .split('statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`   Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i]);
        console.log(`   ✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (error: any) {
        console.error(`   ✗ Statement ${i + 1} failed:`, error.message);
        throw error;
      }
    }

    console.log('\n✅ Base migration complete!');

    // Run platform enum migration
    console.log('\n📦 Running platform enum migration (0001_dashing_liz_osborn.sql)...');
    const enumMigrationPath = join(__dirname, '..', 'drizzle', '0001_dashing_liz_osborn.sql');
    const enumMigrationSQL = readFileSync(enumMigrationPath, 'utf-8');

    const enumStatements = enumMigrationSQL
      .split('-->').join('')
      .split('statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`   Executing ${enumStatements.length} SQL statements...`);

    for (let i = 0; i < enumStatements.length; i++) {
      try {
        await client.query(enumStatements[i]);
        console.log(`   ✓ Statement ${i + 1}/${enumStatements.length} executed`);
      } catch (error: any) {
        // Ignore "already exists" errors for enum values
        if (error.code === '42710') {
          console.log(`   ⊙ Statement ${i + 1}: Already exists, skipping`);
        } else {
          console.error(`   ✗ Statement ${i + 1} failed:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n✅ Platform enum migration complete!');

    // Verify schema
    console.log('\n📊 Verifying schema...');
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n   Tables created:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    const enums = await client.query(`
      SELECT unnest(enum_range(NULL::platform))::text AS platform_value
      ORDER BY platform_value;
    `);

    console.log('\n   Platform enum values:');
    enums.rows.forEach(row => {
      console.log(`   - ${row.platform_value}`);
    });

    client.release();
    await pool.end();

    console.log('\n✨ Database initialization complete!\n');
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    await pool.end();
    process.exit(1);
  }
}

// Auto-run when executed directly
initDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
