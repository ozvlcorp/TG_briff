import { normalizeChatId } from "../../../lib/telegram";

export const runtime = "nodejs";

// Diagnostika sahifasi. Brauzerda /api/health ni oching.
// Test xabar yuborish uchun: /api/health?test=1
// Bot tokeni javobda hech qachon ko'rsatilmaydi.
export async function GET(request) {
  const botToken = process.env.BOT_TOKEN;
  const rawChatId = process.env.ADMIN_CHAT_ID;
  const chatId = normalizeChatId(rawChatId);
  const url = new URL(request.url);
  const doTest = url.searchParams.get("test") === "1";

  const report = {
    env: {
      BOT_TOKEN: botToken ? "✅ set" : "❌ missing",
      ADMIN_CHAT_ID_raw: rawChatId ?? "❌ missing",
      ADMIN_CHAT_ID_used: chatId ?? "❌ missing",
      note: chatId && /^\d+$/.test(chatId)
        ? "⚠️ ID musbat (raqamli). Guruh/superguruh bo'lsa ID '-100...' ko'rinishida (minus bilan) bo'lishi kerak."
        : undefined,
    },
  };

  if (!botToken || !chatId) {
    return Response.json(report, { status: 500 });
  }

  async function callTelegram(method, body) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      return { httpStatus: res.status, ...data };
    } catch (err) {
      return { error: String(err) };
    }
  }

  // 1) Token to'g'rimi? (bot username)
  const me = await callTelegram("getMe", {});
  report.getMe = me.ok
    ? { ok: true, username: `@${me.result?.username}`, id: me.result?.id }
    : me;

  // 2) Chat topiladimi va bot kira oladimi?
  const chat = await callTelegram("getChat", { chat_id: chatId });
  report.getChat = chat.ok
    ? { ok: true, type: chat.result?.type, title: chat.result?.title, id: chat.result?.id }
    : chat;

  // 3) So'ralganda test xabar yuboramiz
  if (doTest) {
    report.sendMessageTest = await callTelegram("sendMessage", {
      chat_id: chatId,
      text: "✅ Test: tg-briff sayti Telegram bilan bog'landi.",
    });
  } else {
    report.hint = "Haqiqiy test xabar yuborish uchun: /api/health?test=1";
  }

  const healthy = me.ok && chat.ok;
  return Response.json(report, { status: healthy ? 200 : 502 });
}
