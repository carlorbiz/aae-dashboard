/**
 * HTTP-based ingestion test
 * Calls the running server's tRPC endpoint
 */

async function testIngestion() {
  const filePath = 'C:\\Users\\carlo\\Development\\mem0-sync\\mem0\\conversations\\exports\\archive\\Claude_20251101.md';

  console.log('📥 Testing Knowledge Graph Ingestion via HTTP\n');
  console.log(`📄 File: ${filePath}\n`);

  try {
    // Call tRPC endpoint via HTTP (using batch format)
    const response = await fetch('http://localhost:3000/trpc/knowledgeGraph.ingestConversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filePath,
        dryRun: true,
        autoPromote: false,
        forceReingest: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, response.statusText);
      console.error('Response:', errorText);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Response received:\n');
    console.log(JSON.stringify(result, null, 2));

  } catch (error: any) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

testIngestion();
