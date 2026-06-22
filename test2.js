import { buildClient } from "@xata.io/client";
import dotenv from "dotenv";
dotenv.config();

const tables = [
  { name: "obras", columns: [{ name: "nome", type: "string" }, { name: "status", type: "string" }] }
];

const DatabaseClient = buildClient();
const client = new DatabaseClient({
  databaseURL: process.env.VITE_XATA_DATABASE_URL,
  apiKey: process.env.VITE_XATA_API_KEY,
  branch: process.env.VITE_XATA_BRANCH || "main"
}, tables);

client.db.obras.getAll().then(res => {
  console.log("SUCCESS:", res);
}).catch(err => {
  console.error("ERROR:", err);
});
