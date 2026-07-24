import fs from 'fs';
import { XataApiClient } from '@xata.io/client';

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  if (line.startsWith('VITE_XATA_API_KEY')) env.apiKey = line.split('=')[1].replace(/"/g, '').trim();
});

const xata = new XataApiClient({ apiKey: env.apiKey });

async function run() {
  try {
    const workspace = 'li03j0nog97un90u88bkosdbm4';
    const region = 'us-east-1';
    // Actually XataApiClient doesn't easily let us add columns if we don't have workspace ID.
    // Let's use fetch instead to the proper domain api.xata.io
    const res = await fetch(`https://api.xata.io/workspaces/${workspace}/dbs/xata:main/tables/lancamentos/columns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'anexos', type: 'file[]' })
    });
    console.log(await res.json());
  } catch (e) {
    console.error(e);
  }
}
run();
