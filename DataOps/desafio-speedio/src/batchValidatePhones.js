import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import twilio from "twilio";
import pkg from "google-libphonenumber";
import os from "os";

dotenv.config();

const { PhoneNumberUtil, PhoneNumberFormat } = pkg;
const phoneUtil = PhoneNumberUtil.getInstance();
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const inputDir = "./data/input";
const outputDir = "./data/output";
const logDir = "./data/logs";

// cria pastas se não existirem
for (const dir of [outputDir, logDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function processFile(filePath) {
  const filename = path.basename(filePath, ".csv");
  const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);

  console.log(`🚀 Processando arquivo: ${filename} (${lines.length} números)\n`);
  const resultados = [];
  const logStream = fs.createWriteStream(`${logDir}/${filename}.log`, { flags: "a" });

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
        logStream.write(`${formatado} ➜ WhatsApp ativo ✅${os.EOL}`);
      } else {
        whatsapp = "não registrado";
        console.log(`${formatado} ➜ sem WhatsApp ❌`);
        logStream.write(`${formatado} ➜ sem WhatsApp ❌${os.EOL}`);
      }
    } catch (err) {
      console.log(`${raw} ➜ inválido ❌ (${err.message})`);
      logStream.write(`${raw} ➜ inválido ❌ (${err.message})${os.EOL}`);
    }

    resultados.push({
      numero_original: raw,
      numero_formatado: formatado,
      status,
      whatsapp,
      data_validacao: new Date().toISOString(),
    });

    // delay entre chamadas Twilio
    await new Promise((r) => setTimeout(r, 1000));
  }

  logStream.end();
  fs.writeFileSync(`${outputDir}/resultados_${filename}.json`, JSON.stringify(resultados, null, 2));

  console.log(`\n✅ Arquivo ${filename} processado com sucesso!\n`);
}

// 🔄 Controla quantos arquivos processar em paralelo
async function main() {
  const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".csv"));
  const concurrency = 3;
  const queue = [];

  for (const file of files) {
    const promise = processFile(path.join(inputDir, file));
    queue.push(promise);

    if (queue.length >= concurrency) {
      await Promise.race(queue);
      queue.splice(queue.findIndex((p) => p.isFulfilled), 1);
    }
  }

  await Promise.all(queue);
  console.log("🏁 Todos os arquivos foram processados!");
}

main();
