async function run() {
  try {
    const res = await fetch('http://localhost:3001/api/fornecedores');
    const data = await res.json();
    console.log("All IDs:", data.map(x => x.id));
  } catch (e) { console.error(e); }
}
run();
