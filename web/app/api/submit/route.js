import { QUESTIONS, classifyScope, renderTz } from "../../../lib/questions";
import { sendTelegramAudio, sendTelegramLongMessage, sendTelegramVoiceDocument } from "../../../lib/telegram";

export const runtime = "nodejs";

function displayName(name, contact) {
  const trimmedName = (name || "").trim();
  const trimmedContact = (contact || "").trim();
  if (trimmedName && trimmedContact) return `${trimmedName} (${trimmedContact})`;
  return trimmedName || trimmedContact || "Noma'lum mijoz";
}

export async function POST(request) {
  const botToken = process.env.BOT_TOKEN;
  const adminChatId = process.env.ADMIN_CHAT_ID;

  if (!botToken || !adminChatId) {
    return Response.json(
      { error: "Server sozlanmagan: BOT_TOKEN yoki ADMIN_CHAT_ID yo'q." },
      { status: 500 }
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Noto'g'ri so'rov formati." }, { status: 400 });
  }

  const clientName = formData.get("client_name");
  const clientContact = formData.get("client_contact");

  const answers = {};
  const voiceEntries = [];

  for (const q of QUESTIONS) {
    const kind = formData.get(`${q.key}__kind`);
    if (kind === "voice") {
      const file = formData.get(`${q.key}__voice`);
      if (file && typeof file.arrayBuffer === "function") {
        answers[q.key] = { kind: "voice" };
        voiceEntries.push({ key: q.key, question: q, file });
      } else {
        answers[q.key] = { kind: "skipped" };
      }
    } else if (kind === "skipped") {
      answers[q.key] = { kind: "skipped" };
    } else {
      const text = formData.get(`${q.key}__text`);
      answers[q.key] = { kind: "text", text: typeof text === "string" ? text : "" };
    }
  }

  const scopeAnswer = answers.scope;
  const scopeKind = classifyScope(scopeAnswer?.kind === "text" ? scopeAnswer.text : null);
  const filledTz = renderTz(answers, scopeKind);
  const header = `👤 Yangi brif (veb-sayt)\nIsm/Kontakt: ${displayName(clientName, clientContact)}\n🕐 Vaqt: ${new Date().toISOString()}`;

  try {
    await sendTelegramLongMessage(botToken, adminChatId, `${header}\n\n--- Tayyor ТЗ ---\n\n${filledTz}`);

    if (voiceEntries.length > 0) {
      await sendTelegramLongMessage(botToken, adminChatId, `🎤 Ovozli javoblar: ${voiceEntries.length} ta`);
      const clientLabel = displayName(clientName, clientContact);
      for (const { question, file } of voiceEntries) {
        const num = QUESTIONS.findIndex((q) => q.key === question.key) + 1;
        const caption = `Savol ${num}. ${question.text}`;
        const arrayBuffer = await file.arrayBuffer();
        const type = file.type || "";
        const name = typeof file.name === "string" ? file.name : "";
        const isAudio = type.includes("mpeg") || type.includes("mp3") || name.endsWith(".mp3");
        const blob = new Blob([arrayBuffer], { type: isAudio ? "audio/mpeg" : type || "audio/webm" });

        if (isAudio) {
          try {
            await sendTelegramAudio(botToken, adminChatId, blob, `javob_${num}.mp3`, caption, {
              title: `Savol ${num} javobi`,
              performer: clientLabel,
            });
            continue;
          } catch (audioErr) {
            console.error("sendAudio muvaffaqiyatsiz, hujjat sifatida yuboramiz:", audioErr);
          }
        }
        // Zaxira: audio bo'lmasa yoki sendAudio ishlamasa — hujjat sifatida
        await sendTelegramVoiceDocument(botToken, adminChatId, blob, name || `javob_${num}.webm`, caption);
      }
    }
  } catch (err) {
    console.error("Failed to deliver brief to Telegram:", err);
    return Response.json(
      { error: "Ma'lumotni yuborishda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true, tz: filledTz });
}
