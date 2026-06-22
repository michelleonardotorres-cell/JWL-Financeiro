import dotenv from 'dotenv';
dotenv.config();

import obras from './api/obras.js';
import fornecedores from './api/fornecedores.js';
import lancamentos from './api/lancamentos.js';
import contratos from './api/contratos.js';

const req = { method: 'GET', query: {} };
const res = {
  status: (code) => ({
    json: (data) => console.log(code, "success"),
    end: () => console.log(code, 'end')
  }),
  setHeader: () => {}
};

async function run() {
  console.log("Testing obras...");
  await obras(req, res).catch(console.error);
  
  console.log("Testing fornecedores...");
  await fornecedores(req, res).catch(console.error);
  
  console.log("Testing lancamentos...");
  await lancamentos(req, res).catch(console.error);
  
  console.log("Testing contratos...");
  await contratos(req, res).catch(console.error);
}

run();
