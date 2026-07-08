const TELEGRAM_MESSAGE_LIMIT = 4096;

export function splitLongMessage(text, limit = TELEGRAM_MESSAGE_LIMIT) {
  if (text.length <= limit) return [text];

  const chunks = [];
  let remaining = text;
  while (remaining.length > limit) {
    let cut = remaining.lastIndexOf("\n", limit);
    if (cut <= 0) cut = remaining.lastIndexOf(" ", limit);
    if (cut <= 0) cut = limit;
    chunks.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

// Vercel env qiymatiga tasodifan qo'shtirnoq yoki bo'sh joy tushib qolishi mumkin.
// Telegram guruh/superguruh ID'lari "-100..." ko'rinishida (manfiy) bo'ladi.
export function normalizeChatId(raw) {
  if (raw == null) return raw;
  return String(raw).trim().replace(/^['"]|['"]$/g, "");
}

function apiUrl(botToken, method) {
  return `https://api.telegram.org/bot${botToken}/${method}`;
}

// Telegram xato holatida ba'zan HTTP 200 bilan {ok:false} qaytarishi mumkin,
// shuning uchun faqat res.ok ga emas, javob tanasidagi ok maydoniga ham qaraymiz.
async function parseTelegramResponse(res, method) {
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    // JSON emas — xom matnni xatoda ko'rsatamiz
  }
  if (!res.ok || !data || data.ok !== true) {
    const description = data?.description || text || `HTTP ${res.status}`;
    throw new Error(`Telegram ${method} failed: ${res.status} ${description}`);
  }
  return data;
}

export async function sendTelegramMessage(botToken, chatId, text) {
  const res = await fetch(apiUrl(botToken, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: normalizeChatId(chatId), text }),
  });
  return parseTelegramResponse(res, "sendMessage");
}

export async function sendTelegramLongMessage(botToken, chatId, text) {
  for (const chunk of splitLongMessage(text)) {
    await sendTelegramMessage(botToken, chatId, chunk);
  }
}

export async function sendTelegramVoiceDocument(botToken, chatId, blob, filename, caption) {
  const form = new FormData();
  form.append("chat_id", normalizeChatId(chatId));
  form.append("caption", caption.slice(0, 1024));
  form.append("document", blob, filename);

  const res = await fetch(apiUrl(botToken, "sendDocument"), {
    method: "POST",
    body: form,
  });
  return parseTelegramResponse(res, "sendDocument");
}

// mp3/m4a audio — Telegram'да o'ynatiladigan audio treki sifatida ko'rinadi.
export async function sendTelegramAudio(botToken, chatId, blob, filename, caption, { title, performer } = {}) {
  const form = new FormData();
  form.append("chat_id", normalizeChatId(chatId));
  form.append("caption", caption.slice(0, 1024));
  if (title) form.append("title", title.slice(0, 64));
  if (performer) form.append("performer", performer.slice(0, 64));
  form.append("audio", blob, filename);

  const res = await fetch(apiUrl(botToken, "sendAudio"), {
    method: "POST",
    body: form,
  });
  return parseTelegramResponse(res, "sendAudio");
}
