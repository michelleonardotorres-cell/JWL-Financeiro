import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[key] = value;
  }
});

const API_KEY = env.VITE_XATA_API_KEY;
const DB_URL = env.VITE_XATA_DATABASE_URL;

async function run() {
  // DB_URL is something like https://li03j0nog97un90u88bkosdbm4.us-east-1.xata.tech/db/xata
  // List branches
  const branchesUrl = `${DB_URL}/branches`;
  console.log('Fetching:', branchesUrl);
  
  let res = await fetch(branchesUrl, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  console.log('Branches:', await res.json());

  // Try to get schema of main branch
  const schemaUrl = `${DB_URL}:main`;
  console.log('Fetching:', schemaUrl);
  res = await fetch(schemaUrl, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  console.log('Main Branch details:', await res.json());
}
run();
