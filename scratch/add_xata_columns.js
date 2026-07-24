import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env to get the keys
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const parseEnv = (content) => {
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  });
  return env;
};

const env = parseEnv(envContent);
const API_KEY = env.VITE_XATA_API_KEY;
const DB_URL = env.VITE_XATA_DATABASE_URL;

if (!API_KEY || !DB_URL) {
  console.error("Missing API key or DB URL");
  process.exit(1);
}

// Ensure the branch is included
const dbUrlWithBranch = DB_URL.includes(':') ? DB_URL : `${DB_URL}:main`;

async function addColumn(table) {
  const url = `${dbUrlWithBranch}/tables/${table}/columns`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'anexos',
      type: 'file[]'
    })
  });

  const data = await response.json();
  if (!response.ok) {
    if (data.message && data.message.includes('already exists')) {
      console.log(`Column 'anexos' already exists in ${table}.`);
    } else {
      console.error(`Error adding column to ${table}:`, data);
    }
  } else {
    console.log(`Successfully added 'anexos' column to ${table}.`, data);
  }
}

async function run() {
  await addColumn('lancamentos');
  await addColumn('contratos');
}

run();
