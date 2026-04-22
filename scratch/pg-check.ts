import { Client } from 'pg';

const connectionString = "postgresql://neondb_owner:npg_OAoe2Id8cZUi@ep-billowing-wildflower-amt2a84q-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function testConnection() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Successfully connected!");
    const res = await client.query('SELECT NOW()');
    console.log("Current time from DB:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

testConnection();
