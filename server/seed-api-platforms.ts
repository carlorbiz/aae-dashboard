/**
 * Seed Script: API Platform Integrations
 *
 * Initializes Gamma and DocsAutomator platforms for authenticated users
 * with their API credentials and connection status.
 *
 * Usage:
 *   npm run seed:platforms
 * or:
 *   ts-node server/seed-api-platforms.ts
 */

import * as db from "./db";

interface APIPlatformConfig {
  platform: "gamma" | "docsautomator";
  apiCredentials: {
    headers: Record<string, string>;
  };
  baseUrl: string;
  description: string;
}

const API_PLATFORMS: APIPlatformConfig[] = [
  {
    platform: "gamma",
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
    platform: "docsautomator",
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

async function seedAPIPlatforms(userId: number) {
  console.log(`\n🌱 Seeding API platform integrations for user ${userId}...\n`);

  for (const config of API_PLATFORMS) {
    try {
      await db.upsertPlatformIntegration({
        userId,
        platform: config.platform,
        status: "connected", // Assume connected if API keys are configured
        lastSynced: new Date(),
        metadata: {
          apiCredentials: config.apiCredentials,
          baseUrl: config.baseUrl,
          description: config.description,
          features: getPlatformFeatures(config.platform),
        },
        errorMessage: null,
      });

      console.log(`✅ ${config.platform.toUpperCase()} - Configured`);
      console.log(`   Base URL: ${config.baseUrl}`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Status: Connected\n`);
    } catch (error) {
      console.error(`❌ ${config.platform.toUpperCase()} - Failed to seed:`, error);
    }
  }

  console.log("✨ API platform seeding complete!\n");
}

function getPlatformFeatures(platform: "gamma" | "docsautomator"): string[] {
  switch (platform) {
    case "gamma":
      return [
        "AI presentation generation",
        "Theme customization",
        "Multiple export formats (PPT, PDF)",
        "Card-based content structure",
        "Image generation integration"
      ];

    case "docsautomator":
      return [
        "Automated Google Docs creation",
        "Template-based document generation",
        "Google Drive URL capture",
        "File artifact management",
        "Notion database integration",
        "Knowledge Lake file repository sync"
      ];

    default:
      return [];
  }
}

// Main execution
async function main() {
  const userIdArg = process.argv[2];

  if (!userIdArg) {
    console.error("\n❌ Error: User ID required");
    console.error("\nUsage:");
    console.error("  npm run seed:platforms <userId>");
    console.error("  ts-node server/seed-api-platforms.ts <userId>");
    console.error("\nExample:");
    console.error("  npm run seed:platforms 1\n");
    process.exit(1);
  }

  const userId = parseInt(userIdArg, 10);

  if (isNaN(userId)) {
    console.error(`\n❌ Error: Invalid user ID '${userIdArg}'. Must be a number.\n`);
    process.exit(1);
  }

  try {
    await seedAPIPlatforms(userId);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { seedAPIPlatforms, API_PLATFORMS };
