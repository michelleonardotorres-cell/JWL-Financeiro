import * as XLSX from "xlsx";
import fs from "fs";

const segmentos = ["Material de Construção", "FRETE", "Venda de Insulfilm", "COMÉRIO VAREJISTA DE MATERIAL ELÉTRICO", "Água/consumo", "Serviços Gerais", "Locação de Equipamentos", "Consultoria"];
const cidades = ["Manaus - AM", "São Paulo - SP", "Rio de Janeiro - RJ", "Belo Horizonte - MG", "Curitiba - PR"];
const nomesFicticios = ["Silva & Silva", "Tech Construções", "Distribuidora Amazonas", "Irmãos Construtores", "Mega Soluções", "Alfa Materiais", "Beto Ferramentas", "Casa & Construção", "Logística Express", "Gama Elétrica"];

const fornecedores = [];

for (let i = 1; i <= 50; i++) {
  const nomeBase = nomesFicticios[Math.floor(Math.random() * nomesFicticios.length)];
  const isJuridica = Math.random() > 0.3;
  const segmento = segmentos[Math.floor(Math.random() * segmentos.length)];
  const cidadeFull = cidades[Math.floor(Math.random() * cidades.length)];
  const [cidade, estado] = cidadeFull.split(" - ");
  const qualificacao = Math.floor(Math.random() * 5) + 1; // 1 to 5
  
  fornecedores.push({
    "Nome / Razão Social": `${nomeBase} ${i} LTDA`,
    "Nome Fantasia": `${nomeBase} ${i}`,
    "Tipo": isJuridica ? "Pessoa Jurídica" : "Pessoa Física",
    "CNPJ/CPF": isJuridica ? `12.345.678/0001-${String(i).padStart(2, '0')}` : `123.456.789-${String(i).padStart(2, '0')}`,
    "Segmento": segmento,
    "Telefone": `(92) 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
    "E-mail": `contato${i}@${nomeBase.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}.com.br`,
    "Cidade": cidade,
    "Estado": estado,
    "Qualificação": qualificacao,
    "Status": Math.random() > 0.1 ? "Ativo" : "Inativo"
  });
}

const ws = XLSX.utils.json_to_sheet(fornecedores);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Fornecedores");
XLSX.writeFile(wb, "fornecedores_ficticios.xlsx");

console.log("Arquivo fornecedores_ficticios.xlsx gerado com sucesso com 50 registros!");
