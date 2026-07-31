const fs = require('fs');
const files = [
  'src/xata.ts',
  'src/types.ts',
  'src/components/Lancamentos.tsx',
  'src/components/ContasPagar.tsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Regex to remove subtipo in type definitions and interfaces
  content = content.replace(/\s*subtipo\??\s*:\s*string\s*;/g, '');
  
  // Regex to remove subtipo from object literals
  content = content.replace(/\s*subtipo\s*:\s*[^,\n]+,?/g, '');
  content = content.replace(/\s*['"]?Subtipo['"]?\s*:\s*[^,\n]+,?/g, '');

  // Remove the table row for Subtipo in Lancamentos print HTML
  content = content.replace(/\s*<tr><th>Subtipo<\/th><td>\$\{lancamento\.subtipo \|\| \"-\"\}<\/td><\/tr>/g, '');

  // For React JSX blocks we need to remove the whole input block for Subtipo.
  // We can use a simpler approach: finding the label Subtipo and replacing until the input is closed.
  content = content.replace(/\s*<label[^>]*>Subtipo<\/label>\s*<input[^>]*value=\{[^\}]*\.subtipo\s*\|\|\s*""\}[^>]*onChange=\{[^}]*\}[^>]*\/>/g, '');
  // Also try replacing without the || "" part
  content = content.replace(/\s*<label[^>]*>Subtipo<\/label>\s*<input[^>]*value=\{[^\}]*\.subtipo\}[^>]*onChange=\{[^}]*\}[^>]*\/>/g, '');

  fs.writeFileSync(file, content);
});
console.log('Removed subtipo occurrences');
