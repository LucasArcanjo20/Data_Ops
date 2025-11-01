import twilio from "twilio";
import dotenv from "dotenv";

import { logEvent } from "./utils/logger.js";

// Dentro do try:
logEvent("sendWhatsAppMessages_success", { to, sid: msg.sid });

// Dentro do catch:
logEvent("sendWhatsAppMessages_fail", { to, error: err.message });


dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const from = process.env.TWILIO_WHATSAPP_FROM;

// Função exportável (usada pelo pipeline)
export async function sendWhatsAppMessages(to = "whatsapp:+5531995418156", message = "🚀 Teste de envio via Twilio Sandbox - SpeedIO") {
  try {
    const msg = await client.messages.create({
      from,
      to,
      body: message,
    });
    console.log("✅ Mensagem enviada com sucesso:", msg.sid);
  } catch (err) {
    console.error("❌ Erro ao enviar mensagem:", err.message);
  }
}
