import fs from 'fs';

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  if (line.startsWith('VITE_XATA_API_KEY')) env.apiKey = line.split('=')[1].replace(/"/g, '').trim();
  if (line.startsWith('VITE_XATA_DATABASE_URL')) env.dbUrl = line.split('=')[1].replace(/"/g, '').trim();
});

const url = env.dbUrl.replace('.tech/db/', '.sh/db/') + ':main/tables/lancamentos/columns';

fetch(url, {
  headers: {
    'Authorization': `Bearer ${env.apiKey}`
  }
}).then(res => res.text()).then(console.log).catch(console.error);
