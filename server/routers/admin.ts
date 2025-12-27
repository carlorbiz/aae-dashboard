/**
 * Admin Router
 *
 * Administrative endpoints for database management and system operations
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const adminRouter = router({
  /**
   * Initialize Database
   * Runs base migrations and platform enum updates
   */
  initDatabase: publicProcedure
    .mutation(async () => {
      const results: string[] = [];

      try {
        results.push('🏗️ Starting database initialization...');

        // Get database pool
        const pool = await db.getPool();
        if (!pool) {
          throw new Error('Database pool not available');
        }

        // Check if database is already initialized
        const checkQuery = await pool.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'users';
        `);

        if (checkQuery.rows.length > 0) {
          results.push('✅ Database already initialized (users table exists)');

          // Just run the platform enum update
          results.push('📦 Checking platform enum...');

          try {
            await pool.query(`ALTER TYPE platform ADD VALUE IF NOT EXISTS 'gamma';`);
            results.push('✓ Added gamma to platform enum');
          } catch (error: any) {
            if (error.code === '42710') {
              results.push('⊙ gamma already exists in platform enum');
            } else {
              throw error;
            }
          }

          try {
            await pool.query(`ALTER TYPE platform ADD VALUE IF NOT EXISTS 'docsautomator';`);
            results.push('✓ Added docsautomator to platform enum');
          } catch (error: any) {
            if (error.code === '42710') {
              results.push('⊙ docsautomator already exists in platform enum');
            } else {
              throw error;
            }
          }

          // Verify
          const enumsQuery = await pool.query(`
            SELECT unnest(enum_range(NULL::platform))::text AS platform_value
            ORDER BY platform_value;
          `);

          results.push('\n📊 Current platform enum values:');
          enumsQuery.rows.forEach((row: any) => {
            results.push(`   - ${row.platform_value}`);
          });

          return {
            success: true,
            message: results.join('\n'),
          };
        }

        // Run base migration
        results.push('📦 Running base migration...');
        // In production, files are in /app/dist/, migrations are in /app/drizzle/
        const projectRoot = process.cwd();
        const baseMigrationPath = join(projectRoot, 'drizzle', '0000_material_meteorite.sql');
        results.push(`   Migration path: ${baseMigrationPath}`);
        const baseMigrationSQL = readFileSync(baseMigrationPath, 'utf-8');

        const statements = baseMigrationSQL
          .split('-->').join('')
          .split('statement-breakpoint')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          await pool.query(statement);
        }

        results.push(`✓ Base migration complete (${statements.length} statements)`);

        // Run platform enum migration
        results.push('📦 Running platform enum migration...');
        const enumMigrationPath = join(projectRoot, 'drizzle', '0001_dashing_liz_osborn.sql');
        const enumMigrationSQL = readFileSync(enumMigrationPath, 'utf-8');

        const enumStatements = enumMigrationSQL
          .split('-->').join('')
          .split('statement-breakpoint')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of enumStatements) {
          try {
            await pool.query(statement);
          } catch (error: any) {
            if (error.code === '42710') {
              // Ignore "already exists" errors
              continue;
            }
            throw error;
          }
        }

        results.push(`✓ Platform enum migration complete (${enumStatements.length} statements)`);

        // Verify
        const tablesQuery = await pool.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `);

        results.push('\n📊 Tables created:');
        tablesQuery.rows.forEach((row: any) => {
          results.push(`   - ${row.table_name}`);
        });

        const enumsQuery = await pool.query(`
          SELECT unnest(enum_range(NULL::platform))::text AS platform_value
          ORDER BY platform_value;
        `);

        results.push('\n📊 Platform enum values:');
        enumsQuery.rows.forEach((row: any) => {
          results.push(`   - ${row.platform_value}`);
        });

        results.push('\n✨ Database initialization complete!');

        return {
          success: true,
          message: results.join('\n'),
        };

      } catch (error) {
        results.push(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        return {
          success: false,
          message: results.join('\n'),
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  /**
   * Create Admin User
   * Creates a default admin user for initial setup
   */
  createAdminUser: publicProcedure
    .mutation(async () => {
      const results: string[] = [];

      try {
        results.push('👤 Creating admin user...');

        // Check if user already exists
        const existingUser = await db.getUserByEmail('admin@aae-dashboard.local');

        if (existingUser) {
          results.push(`✅ Admin user already exists (ID: ${existingUser.id})`);
          return {
            success: true,
            message: results.join('\n'),
            userId: existingUser.id,
          };
        }

        // Create admin user
        await db.upsertUser({
          openId: 'admin-local',
          email: 'admin@aae-dashboard.local',
          name: 'Admin User',
          role: 'admin',
          loginMethod: 'local',
          lastSignedIn: new Date(),
        });

        // Fetch the created user to get the ID
        const newUser = await db.getUserByEmail('admin@aae-dashboard.local');

        if (!newUser) {
          throw new Error('Failed to create admin user');
        }

        results.push(`✅ Admin user created (ID: ${newUser.id})`);
        results.push(`   Email: ${newUser.email}`);
        results.push(`   Name: ${newUser.name}`);
        results.push(`   Role: ${newUser.role}`);

        return {
          success: true,
          message: results.join('\n'),
          userId: newUser.id,
        };

      } catch (error) {
        results.push(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        return {
          success: false,
          message: results.join('\n'),
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  /**
   * Seed Platform Integrations
   * Seeds Gamma and DocsAutomator platform integrations
   */
  seedPlatforms: publicProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const results: string[] = [];

      try {
        results.push('🌱 Seeding API platform integrations...');

        const platforms = [
          {
            platform: 'gamma' as const,
            apiCredentials: {
              headers: {
                "X-API-KEY": "sk-gamma-O6q9C8hKRZr8yNERNEP283NZu5POux7Ya2O1HvjuE",
                "Content-Type": "application/json"
              }
            },
            baseUrl: "https://public-api.gamma.app/v0.2",
            description: "Gamma AI presentation generation API"
          },
          {
            platform: 'docsautomator' as const,
            apiCredentials: {
              headers: {
                "Authorization": "Bearer 3e634bb0-452f-46b8-9ed2-d19ba4e0c1dc",
                "Content-Type": "application/json"
              }
            },
            baseUrl: "https://api.docsautomator.co",
            description: "DocsAutomator API for automated Google Docs creation and file artifact management"
          }
        ];

        for (const config of platforms) {
          try {
            results.push(`📦 Processing ${config.platform.toUpperCase()}...`);

            await db.upsertPlatformIntegration({
              userId: input.userId,
              platform: config.platform,
              status: "connected",
              lastSynced: new Date(),
              metadata: {
                apiCredentials: config.apiCredentials,
                baseUrl: config.baseUrl,
                description: config.description,
              },
            });

            results.push(`✅ ${config.platform.toUpperCase()} - Configured`);
          } catch (platformError: any) {
            results.push(`❌ ${config.platform.toUpperCase()} - Failed`);
            results.push(`   Error: ${platformError.message || String(platformError)}`);
            results.push(`   Details: ${JSON.stringify(platformError, null, 2)}`);
            throw platformError; // Re-throw to trigger outer catch
          }
        }

        results.push('\n✨ Platform seeding complete!');

        return {
          success: true,
          message: results.join('\n'),
        };

      } catch (error) {
        results.push(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        return {
          success: false,
          message: results.join('\n'),
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
});
