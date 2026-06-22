const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');
const files = ['Lancamentos.tsx', 'Contratos.tsx', 'ContasPagar.tsx'];

for (const f of files) {
  const filePath = path.join(dir, f);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import Combobox
  if (!content.includes('import Combobox')) {
    content = content.replace(
      /import \{ useData \} from "\.\.\/contexts\/DataContext";/g,
      `import { useData } from "../contexts/DataContext";\nimport Combobox from "./Combobox";`
    );
  }

  // Lancamentos.tsx adding
  // Fornecedor
  content = content.replace(
    /<input[^>]*list="fornecedores-list"[\s\S]*?onChange=\{\(e\) => setEntry\(\{ \.\.\.entry, fornecedorId: e\.target\.value \}\)\}[\s\S]*?<\/datalist>/g,
    `<Combobox options={fornecedores.map(f => ({ id: f.id, label: f.nome }))} value={entry.fornecedorId || ""} onChange={(id) => setEntry({ ...entry, fornecedorId: id })} placeholder="Selecionar Fornecedor" />`
  );
  // Obra
  content = content.replace(
    /<input[^>]*list="obras-list"[\s\S]*?onChange=\{\(e\) => setEntry\(\{ \.\.\.entry, obraId: e\.target\.value \}\)\}[\s\S]*?<\/datalist>/g,
    `<Combobox options={obras.map(o => ({ id: o.id, label: o.nome }))} value={entry.obraId || ""} onChange={(id) => setEntry({ ...entry, obraId: id })} placeholder="Selecionar Obra" />`
  );

  // Lancamentos.tsx editing
  // Fornecedor
  content = content.replace(
    /<input[^>]*list="fornecedores-list-edit"[\s\S]*?onChange=\{\(e\) => setEditEntry\(\{ \.\.\.editEntry, fornecedorId: e\.target\.value \}\)\}[\s\S]*?<\/datalist>/g,
    `<Combobox options={fornecedores.map(f => ({ id: f.id, label: f.nome }))} value={editEntry?.fornecedorId || ""} onChange={(id) => setEditEntry({ ...editEntry, fornecedorId: id })} placeholder="Selecionar Fornecedor" />`
  );
  // Obra
  content = content.replace(
    /<input[^>]*list="obras-list-edit"[\s\S]*?onChange=\{\(e\) => setEditEntry\(\{ \.\.\.editEntry, obraId: e\.target\.value \}\)\}[\s\S]*?<\/datalist>/g,
    `<Combobox options={obras.map(o => ({ id: o.id, label: o.nome }))} value={editEntry?.obraId || ""} onChange={(id) => setEditEntry({ ...editEntry, obraId: id })} placeholder="Selecionar Obra" />`
  );

  // Contratos.tsx
  content = content.replace(
    /<input[^>]*list="fornecedores-list"[\s\S]*?onChange=\{\(e\) => setNewEntry\(\{ \.\.\.newEntry, recebedorFornecedor: e\.target\.value \}\)\}[\s\S]*?<\/datalist>/g,
    `<Combobox options={fornecedores.map(f => ({ id: f.id, label: f.nome }))} value={newEntry.recebedorFornecedor || ""} onChange={(id) => setNewEntry({ ...newEntry, recebedorFornecedor: id })} placeholder="Selecionar Fornecedor" />`
  );
  content = content.replace(
    /<input[^>]*list="obras-list"[\s\S]*?onChange=\{\(e\) => setNewEntry\(\{ \.\.\.newEntry, obraId: e\.target\.value \}\)\}[\s\S]*?<\/datalist>/g,
    `<Combobox options={obras.map(o => ({ id: o.id, label: o.nome }))} value={newEntry.obraId || ""} onChange={(id) => setNewEntry({ ...newEntry, obraId: id })} placeholder="Selecionar Obra" />`
  );

  // ContasPagar.tsx adding
  content = content.replace(
    /<input[^>]*list="fornecedores-list"[\s\S]*?onChange=\{\(e\) => setNewConta\(\{ \.\.\.newConta, recebedorFornecedor: e\.target\.value \}\)\}[\s\S]*?<\/datalist>/g,
    `<Combobox options={fornecedores.map(f => ({ id: f.id, label: f.nome }))} value={newConta.recebedorFornecedor || ""} onChange={(id) => setNewConta({ ...newConta, recebedorFornecedor: id })} placeholder="Selecionar Fornecedor" />`
  );
  content = content.replace(
    /<input[^>]*list="obras-list"[\s\S]*?onChange=\{\(e\) => setNewConta\(\{ \.\.\.newConta, obraId: e\.target\.value \}\)\}[\s\S]*?<\/datalist>/g,
    `<Combobox options={obras.map(o => ({ id: o.id, label: o.nome }))} value={newConta.obraId || ""} onChange={(id) => setNewConta({ ...newConta, obraId: id })} placeholder="Selecionar Obra" />`
  );

  // ContasPagar.tsx editing
  content = content.replace(
    /<input[^>]*list="fornecedores-list-edit"[\s\S]*?onChange=\{\(e\) => setEditConta\(\{ \.\.\.editConta, recebedorFornecedor: e\.target\.value \}\)\}[\s\S]*?<\/datalist>/g,
    `<Combobox options={fornecedores.map(f => ({ id: f.id, label: f.nome }))} value={editConta?.recebedorFornecedor || ""} onChange={(id) => setEditConta({ ...editConta, recebedorFornecedor: id })} placeholder="Selecionar Fornecedor" />`
  );
  content = content.replace(
    /<input[^>]*list="obras-list-edit"[\s\S]*?onChange=\{\(e\) => setEditConta\(\{ \.\.\.editConta, obraId: e\.target\.value \}\)\}[\s\S]*?<\/datalist>/g,
    `<Combobox options={obras.map(o => ({ id: o.id, label: o.nome }))} value={editConta?.obraId || ""} onChange={(id) => setEditConta({ ...editConta, obraId: id })} placeholder="Selecionar Obra" />`
  );

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log("Replaced with Combobox");
