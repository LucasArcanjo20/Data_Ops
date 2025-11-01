/**
 * 🔄 pipeline.js
 * Orquestração completa do fluxo DataOps:
 * 1️⃣ Validação de telefones
 * 2️⃣ Enriquecimento profissional (LinkedIn)
 * 3️⃣ Prospecção via WhatsApp
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Importa os módulos do seu projeto
import { validatePhonesTwilio } from "./validatePhonesTwilio.js";
import { sendWhatsAppMessages } from "./sendWhatsAppMessages.js";
import pkg from "../linkedin-scraper/index.js";
const { runLinkedinScraper } = pkg;

import { logEvent } from "./utils/logger.js";

logEvent("pipeline_finished", { status: "success" });



dotenv.config();

const LOG_PATH = path.resolve("./data/logs.json");

/**
 * 🧾 Função para salvar logs estruturados
 */
function appendLog(entry) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, ...entry };

  let logs = [];
  if (fs.existsSync(LOG_PATH)) {
    try {
      logs = JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
    } catch {
      logs = [];
    }
  }
  logs.push(logEntry);
  fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2));
}

/**
 * 🚀 Função principal do pipeline
 */
async function runPipeline() {
  console.log("🚀 Iniciando pipeline DataOps...\n");

  try {
    // 1️⃣ VALIDAÇÃO DE TELEFONES
    console.log("📞 Etapa 1: Validação de Telefones (Twilio)");
    const validPhones = await validatePhonesTwilio();
    appendLog({ stage: "validatePhones", status: "ok", count: validPhones.length });
    console.log(`✅ Telefones validados: ${validPhones.length}\n`);

    // 2️⃣ ENRIQUECIMENTO DE DADOS (LinkedIn)
    console.log("🧠 Etapa 2: Enriquecimento (LinkedIn Scraper)");
    const enrichedData = await runLinkedinScraper(validPhones);
    appendLog({ stage: "linkedinScraper", status: "ok", count: enrichedData.length });
    console.log(`✅ Perfis enriquecidos: ${enrichedData.length}\n`);

    // 3️⃣ PROSPECÇÃO VIA WHATSAPP
    console.log("💬 Etapa 3: Prospecção via WhatsApp");
    const messagesSent = await sendWhatsAppMessages(enrichedData);
    appendLog({ stage: "whatsappProspection", status: "ok", count: messagesSent.length });
    console.log(`✅ Mensagens enviadas: ${messagesSent.length}\n`);

    console.log("🎯 Pipeline concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro no pipeline:", error);
    appendLog({ stage: "error", message: error.message });
  }
}

// Executa o pipeline
runPipeline();
