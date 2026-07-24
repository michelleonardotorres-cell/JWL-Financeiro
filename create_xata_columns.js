import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
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
// The API url uses .sh, not .tech
const API_URL = env.VITE_XATA_DATABASE_URL.replace('.tech/db/', '.sh/db/');

async function addColumn(table) {
  const url = `${API_URL}:main/tables/${table}/columns`;
  
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
    console.error(`Error adding column to ${table}:`, data);
  } else {
    console.log(`Successfully added 'anexos' column to ${table}.`);
  }
}

async function run() {
  await addColumn('lancamentos');
  await addColumn('contratos');
}

run();
