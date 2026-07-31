const fs = require('fs');
const files = [
  'src/xata.ts',
  'src/components/Lancamentos.tsx',
  'src/components/ContasPagar.tsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove { name: "subtipo", type: "string" },
  content = content.replace(/\s*\{\s*name\s*:\s*["']subtipo["']\s*,\s*type\s*:\s*["']string["']\s*\},/g, '');

  // Remove the div wrapper that has the subtipo label and input
  content = content.replace(/<div[^>]*>\s*<label[^>]*>Subtipo<\/label>\s*<input[^>]*placeholder="Subtipo"[^>]*onChange=\{[^}]*\}[^>]*\/>\s*<\/div>/g, '');
  content = content.replace(/<div[^>]*>\s*<label[^>]*>Subtipo<\/label>\s*<input[^>]*value=\{[^\}]*\}[^>]*onChange=\{[^}]*\}[^>]*\/>\s*<\/div>/g, '');
  content = content.replace(/<label[^>]*>Subtipo<\/label>\s*<input[^>]*placeholder="Subtipo"[^>]*onChange=\{[^}]*\}[^>]*\/>/g, '');
  content = content.replace(/<label[^>]*>Subtipo<\/label>\s*<input[^>]*value=\{[^\}]*\}[^>]*onChange=\{[^}]*\}[^>]*\/>/g, '');

  fs.writeFileSync(file, content);
});
console.log('Removed remaining subtipo occurrences');
