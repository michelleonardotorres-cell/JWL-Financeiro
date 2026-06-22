import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import API handlers
import obrasHandler from './api/obras.js';
import fornecedoresHandler from './api/fornecedores.js';
import lancamentosHandler from './api/lancamentos.js';
import contratosHandler from './api/contratos.js';
import recebedoresHandler from './api/recebedores.js';

const app = express();
const port = 3001;

// Middleware matching Vercel's parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Wrapper to adapt Express req/res to Vercel's Serverless Function signature
const vercelHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }
};

// Map routes
app.all('/api/obras', vercelHandler(obrasHandler));
app.all('/api/fornecedores', vercelHandler(fornecedoresHandler));
app.all('/api/lancamentos', vercelHandler(lancamentosHandler));
app.all('/api/contratos', vercelHandler(contratosHandler));
app.all('/api/recebedores', vercelHandler(recebedoresHandler));

app.listen(port, () => {
  console.log(`API Server is running locally on http://localhost:${port}`);
  console.log('You can now use the Vite dev server which will proxy /api to this server.');
});
