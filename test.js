import { getXataClient } from './src/xata.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const xata = getXataClient();
  try {
    const res = await xata.sql`SELECT 1 as result`;
    console.log("SQL SUCCESS:", res);
  } catch(e) {
    console.error("SQL ERROR:", e);
  }
}
run();
