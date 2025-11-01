import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const to = "whatsapp:+5531995418156"; // coloque seu número com DDI e DDD
const from = process.env.TWILIO_WHATSAPP_FROM;

const message = "🚀 Teste de envio via Twilio Sandbox - SpeedIO";

async function sendMessage() {
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

sendMessage();
