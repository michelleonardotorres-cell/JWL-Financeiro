const fs = require('fs');
const files = [
  'src/components/Lancamentos.tsx',
  'src/components/ContasPagar.tsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Regex to remove subtipo from object literals
  content = content.replace(/\s*subtipo\s*:\s*[^,\n]+,?/g, '');
  content = content.replace(/\s*['"]?Subtipo['"]?\s*:\s*[^,\n]+,?/g, '');

  // Remove the table row for Subtipo in Lancamentos print HTML
  content = content.replace(/\s*<tr><th>Subtipo<\/th><td>\$\{lancamento\.subtipo \|\| \"-\"\}<\/td><\/tr>/g, '');

  fs.writeFileSync(file, content);
});
console.log('Removed object subtipo occurrences');
