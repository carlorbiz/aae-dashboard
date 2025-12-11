#!/usr/bin/env node
/**
 * Test Notion API Access to ACRRM Database
 *
 * This script tests whether the NOTION_N8N_AI_ROUTER_INTEGRATION_TOKEN
 * has access to the ACRRM Resource Development Pipeline database.
 */

import 'dotenv/config';

const NOTION_TOKEN = process.env.NOTION_N8N_AI_ROUTER_INTEGRATION_TOKEN;
const ACRRM_DATABASE_ID = 'd431098f-103a-4d3e-9cb5-82143e42d75b';

async function testNotionAccess() {
  if (!NOTION_TOKEN) {
    console.error('❌ NOTION_N8N_AI_ROUTER_INTEGRATION_TOKEN not found in .env file');
    process.exit(1);
  }

  console.log('🔍 Testing Notion API access...\n');
  console.log(`Database ID: ${ACRRM_DATABASE_ID}`);
  console.log(`Token: ${NOTION_TOKEN.substring(0, 10)}...${NOTION_TOKEN.substring(NOTION_TOKEN.length - 4)}\n`);

  try {
    // Test 1: Query the database
    console.log('📋 Test 1: Querying ACRRM database...');
    const response = await fetch(
      `https://api.notion.com/v1/databases/${ACRRM_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page_size: 5
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`\n❌ Access denied (HTTP ${response.status})`);
      console.error('Error:', errorData);

      if (response.status === 404 || errorData.code === 'object_not_found') {
        console.log('\n📌 SOLUTION: The integration needs access to this database.');
        console.log('   1. Open the ACRRM database in Notion');
        console.log('   2. Click "..." menu → "Add connections"');
        console.log('   3. Select "N8N AI Router" integration');
        console.log('   4. Re-run this test\n');
      }

      return false;
    }

    const data = await response.json();
    console.log(`✅ Success! Retrieved ${data.results.length} entries`);

    if (data.results.length > 0) {
      console.log('\n📄 Sample entry:');
      const firstEntry = data.results[0];
      console.log(`   ID: ${firstEntry.id}`);

      // Extract title property
      const titleProp = firstEntry.properties['Content Title'] || firstEntry.properties.title;
      if (titleProp) {
        const title = titleProp.title?.[0]?.plain_text || titleProp.rich_text?.[0]?.plain_text || 'N/A';
        console.log(`   Title: ${title}`);
      }

      console.log(`   URL: ${firstEntry.url}`);
    }

    // Test 2: Retrieve database metadata
    console.log('\n📋 Test 2: Retrieving database metadata...');
    const dbResponse = await fetch(
      `https://api.notion.com/v1/databases/${ACRRM_DATABASE_ID}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28'
        }
      }
    );

    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      console.log(`✅ Database: ${dbData.title?.[0]?.plain_text || 'Untitled'}`);
      console.log(`   Properties: ${Object.keys(dbData.properties).length}`);
    }

    console.log('\n✅ ALL TESTS PASSED!');
    console.log('   Your NOTION_N8N_AI_ROUTER_INTEGRATION_TOKEN has access to the ACRRM database.');
    console.log('   You can use this token in the notion-proxy server.\n');

    return true;
  } catch (error) {
    console.error('\n❌ Error testing Notion access:', error.message);
    return false;
  }
}

testNotionAccess()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
