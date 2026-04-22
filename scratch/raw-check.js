const { Client } = require('pg');

async function test() {
  const directUrl = "postgresql://neondb_owner:npg_OAoe2Id8cZUi@ep-billowing-wildflower-amt2a84q.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const pooledUrl = "postgresql://neondb_owner:npg_OAoe2Id8cZUi@ep-billowing-wildflower-amt2a84q-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

  console.log("Testing Direct...");
  const client1 = new Client({ connectionString: directUrl });
  try {
    await client1.connect();
    console.log("Direct Success!");
    await client1.end();
  } catch (e) {
    console.log("Direct Failed:", e.message);
  }

  console.log("\nTesting Pooled...");
  const client2 = new Client({ connectionString: pooledUrl });
  try {
    await client2.connect();
    console.log("Pooled Success!");
    await client2.end();
  } catch (e) {
    console.log("Pooled Failed:", e.message);
  }
}

test();
