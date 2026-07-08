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

function apiUrl(botToken, method) {
  return `https://api.telegram.org/bot${botToken}/${method}`;
}

export async function sendTelegramMessage(botToken, chatId, text) {
  const res = await fetch(apiUrl(botToken, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
  return res.json();
}

export async function sendTelegramLongMessage(botToken, chatId, text) {
  for (const chunk of splitLongMessage(text)) {
    await sendTelegramMessage(botToken, chatId, chunk);
  }
}

export async function sendTelegramVoiceDocument(botToken, chatId, blob, filename, caption) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption.slice(0, 1024));
  form.append("document", blob, filename);

  const res = await fetch(apiUrl(botToken, "sendDocument"), {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram sendDocument failed: ${res.status} ${body}`);
  }
  return res.json();
}
