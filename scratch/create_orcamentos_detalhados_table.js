import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env');
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
const API_URL = env.VITE_XATA_DATABASE_URL.replace('.tech/db/', '.sh/db/');

async function createTable() {
  const url = `${API_URL}:main/tables/orcamentos_detalhados`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    }
  });

  const data = await response.json();
  if (!response.ok) {
    console.error(`Error creating table:`, data);
    return false;
  }
  console.log(`Successfully created table orcamentos_detalhados.`);
  return true;
}

async function addColumn(name, type) {
  const url = `${API_URL}:main/tables/orcamentos_detalhados/columns`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, type })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error(`Error adding column ${name}:`, data);
  } else {
    console.log(`Successfully added '${name}' column.`);
  }
}

async function run() {
  const created = await createTable();
  if (created) {
    await addColumn('nomeEtapa', 'string');
    await addColumn('obraId', 'string');
    await addColumn('itens', 'text');
    await addColumn('cotacoesMat', 'text');
    await addColumn('cotacoesMo', 'text');
    await addColumn('totalPlanilha', 'float');
    await addColumn('totalRealMat', 'float');
    await addColumn('totalRealMo', 'float');
  }
}

run();
