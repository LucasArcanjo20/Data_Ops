const fs = require("fs");
const path = require("path");

console.log("\n📊 Gerando Relatório Final…\n");

// Carrega resultados
const file = path.join(__dirname, "../output/resultados_telefones.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

let total = data.length;
let validos = 0;
let ativos = 0;
let linhas = [];

data.forEach(item => {
  if (item.status === "válido") validos++;
  if (item.whatsapp === "ativo") ativos++;
  linhas.push(item);
});

const resumo = {
  total,
  validos,
  ativos,
  taxa_ativos: ((ativos / total) * 100).toFixed(2) + "%"
};

console.log("✅ RESUMO GERAL:");
console.table(resumo);

// Salva relatório CSV final
const csv = linhas.map(l => `${l.telefone};${l.status};${l.whatsapp}`).join("\n");
fs.writeFileSync(path.join(__dirname, "../output/relatorio_final.csv"), csv);

console.log("\n✅ relatorio_final.csv gerado com sucesso em /output!\n");
