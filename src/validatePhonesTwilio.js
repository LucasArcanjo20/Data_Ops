import fs from "fs";
import twilio from "twilio";
import dotenv from "dotenv";
import pkg from "google-libphonenumber";

const { PhoneNumberUtil, PhoneNumberFormat } = pkg;
const phoneUtil = PhoneNumberUtil.getInstance();

dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const lines = fs.readFileSync("./data/telefones.csv", "utf8").split("\n").filter(Boolean);

console.log("📞 Iniciando checagem real de WhatsApp...\n");

const resultados = [];

for (const raw of lines) {
  let status = "inválido";
  let formatado = null;
  let whatsapp = "não verificado";

  try {
    const parsed = phoneUtil.parse(raw, "BR");
    formatado = phoneUtil.format(parsed, PhoneNumberFormat.E164);
    status = "válido";

    const lookup = await client.lookups.v2.phoneNumbers(formatado)
      .fetch({ type: ["whatsapp", "carrier"] });

    if (lookup?.whatsapp?.status === "WHATSAPP_REGISTERED") {
      whatsapp = "ativo";
      console.log(`${formatado} ➜ WhatsApp ativo ✅`);
    } else {
      whatsapp = "não registrado";
      console.log(`${formatado} ➜ sem WhatsApp ❌`);
    }
  } catch (err) {
    console.log(`${raw} ➜ inválido ❌ (${err.message})`);
  }

  resultados.push({
    numero_original: raw,
    numero_formatado: formatado,
    status,
    whatsapp,
    data_validacao: new Date().toISOString(),
  });

  await new Promise((r) => setTimeout(r, 1200)); // evita bloqueio
}

fs.writeFileSync("./data/resultados.json", JSON.stringify(resultados, null, 2));

console.log("\n✅ Checagem concluída!");
console.log("📁 Resultados salvos em: data/resultados.json");
