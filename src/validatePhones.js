import fs from "fs";
import twilio from "twilio";
import dotenv from "dotenv";

// ⚙️ Import compatível com CommonJS
import pkg from "google-libphonenumber";
const { PhoneNumberUtil, PhoneNumberFormat } = pkg;


// Lê o arquivo CSV com os números
const lines = fs
  .readFileSync("./data/telefones.csv", "utf8")
  .split("\n")
  .filter(Boolean);

console.log("📞 Iniciando validação de telefones...\n");

const resultados = [];

for (const raw of lines) {
  let status = "inválido";
  let formatado = null;

  try {
    const parsed = phoneUtil.parse(raw, "BR");
    formatado = phoneUtil.format(parsed, PhoneNumberFormat.E164);
    status = "válido";
    console.log(`${raw} ➜ ${formatado} ✅`);
  } catch (err) {
    console.log(`${raw} ➜ inválido ❌`);
  }

  resultados.push({
    numero_original: raw,
    numero_formatado: formatado,
    status,
    data_validacao: new Date().toISOString(),
  });
}

// Salva os resultados no arquivo JSON
fs.writeFileSync("./data/resultados.json", JSON.stringify(resultados, null, 2));

console.log("\n✅ Validação concluída!");
console.log("📁 Resultados salvos em: data/resultados.json");
