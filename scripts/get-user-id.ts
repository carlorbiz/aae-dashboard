/**
 * Helper Script: Get User ID
 *
 * Queries the database to find your user ID for seeding platforms.
 *
 * Usage:
 *   ts-node scripts/get-user-id.ts
 */

import * as db from "../server/db";

interface UserRow {
  id: number;
  name: string | null;
  email: string | null;
  openId: string | null;
  lastSignedIn: Date | null;
}

async function getUserId() {
  console.log("\n🔍 Looking up users in AAE Dashboard database...\n");

  try {
    const database = await db.getDb();

    if (!database) {
      console.error("❌ Error: Could not connect to database");
      console.error("Make sure DATABASE_URL environment variable is set\n");
      process.exit(1);
    }

    // Query all users
    const result = await database.query<UserRow>(`
      SELECT id, name, email, "openId", "lastSignedIn"
      FROM users
      ORDER BY id;
    `);

    if (result.rows.length === 0) {
      console.log("⚠️  No users found in database");
      console.log("You may need to sign in to the AAE Dashboard first\n");
      process.exit(0);
    }

    console.log("📋 Users in database:\n");
    console.log("┌────┬─────────────────────┬──────────────────────────┬──────────────────────┐");
    console.log("│ ID │ Name                │ Email                    │ Last Signed In       │");
    console.log("├────┼─────────────────────┼──────────────────────────┼──────────────────────┤");

    result.rows.forEach((user) => {
      const id = String(user.id).padEnd(2);
      const name = (user.name || "—").padEnd(19);
      const email = (user.email || "—").padEnd(24);
      const lastSignedIn = user.lastSignedIn
        ? new Date(user.lastSignedIn).toLocaleDateString()
        : "Never";

      console.log(`│ ${id} │ ${name} │ ${email} │ ${lastSignedIn.padEnd(20)} │`);
    });

    console.log("└────┴─────────────────────┴──────────────────────────┴──────────────────────┘\n");

    if (result.rows.length === 1) {
      const userId = result.rows[0].id;
      console.log(`✅ Found your user ID: ${userId}`);
      console.log(`\n📝 Next step - Run seeding command:`);
      console.log(`   npm run seed:platforms ${userId}`);
      console.log(`   or`);
      console.log(`   ts-node server/seed-api-platforms.ts ${userId}\n`);
    } else {
      console.log(`ℹ️  Multiple users found. Use the ID for your account in the seeding command.\n`);
    }

  } catch (error) {
    console.error("❌ Error querying database:", error);
    process.exit(1);
  }

  process.exit(0);
}

getUserId();
