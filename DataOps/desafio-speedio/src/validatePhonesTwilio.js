import twilio from "twilio";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Função exportável
export async function validatePhonesTwilio() {
  console.log("📞 Iniciando validação de telefones via Twilio...");

  const inputPath = "./data/input/telefones.csv";
  const outputPath = "./data/output/resultados_twilio.json";

  if (!fs.existsSync(inputPath)) {
    console.error("❌ Arquivo de entrada não encontrado:", inputPath);
    return;
  }

  const lines = fs.readFileSync(inputPath, "utf8").split("\n").filter(Boolean);
  const results = [];

  for (const phone of lines) {
    try {
      const lookup = await client.lookups.v1.phoneNumbers(phone).fetch({ type: ["carrier"] });
      results.push({ phone, valid: true, carrier: lookup.carrier.name || "Desconhecido" });
      console.log(`✅ ${phone} válido (${lookup.carrier.name || "Desconhecido"})`);
    } catch {
      results.push({ phone, valid: false });
      console.log(`❌ ${phone} inválido`);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`📁 Resultados salvos em: ${outputPath}`);
}
