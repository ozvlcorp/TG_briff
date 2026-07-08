# tz-brief-web — Ozvlcorp brif-sayti

Ozvlcorp agentligi uchun HR va moliya AI-agentlar bo'yicha brif yig'ish veb-sayti. `tz-bot/` dagi Telegram-botning veb-versiyasi — bir xil 17 ta savol va bir xil ТЗ shabloni ishlatiladi, faqat mijoz brauzerda to'ldiradi.

Mijoz saytga kiradi → har savolga **matn yozadi yoki mikrofon orqali ovoz yozadi** → oxirida "Yakunlash" tugmasini bosadi. Sayt to'ldirilgan ma'lumotni serverless funksiya orqali sizning Telegram admin chatingizga yuboradi (xuddi `tz-bot` kabi — matn ТЗ + ovozli javob fayllari).

## Xususiyatlari

- 17 ta savol, `tz-bot/questions.py` bilan bir xil matn va shablon (`lib/questions.js`).
- Har savolga matn yoki brauzer mikrofoni orqali ovoz bilan javob berish.
- O'tkazib yuborish, orqaga qaytish, erta yakunlash imkoniyati.
- Yakunda: mijozga to'ldirilgan ТЗ ko'rsatiladi, adminga Telegram orqali ТЗ + ovoz fayllari yuboriladi.
- LLM/STT kerak emas — faqat Telegram Bot API (mavjud bot tokenidan foydalaniladi).

## Talablar

- Node.js 20+
- Xuddi `tz-bot`dagi bot tokeni va admin chat ID (bir xil bot ikkalasiga ham xizmat qiladi).

## Lokal ishga tushirish

```bash
cd web
npm install

cp .env.example .env.local
# .env.local ichiga BOT_TOKEN va ADMIN_CHAT_ID ni yozing

npm run dev
```

`http://localhost:3000` ni oching.

> **Eslatma:** mikrofon brauzerda faqat `https://` yoki `localhost` ostida ishlaydi — bu standart brauzer talabi.

## Deploy (Vercel)

1. [vercel.com](https://vercel.com) da yangi loyiha yarating, `ozvlcorp/TG_briff` reposini ulang.
2. **Root Directory**: `web` deb ko'rsating (repo tub katalogida `tz-bot/` ham borligi uchun muhim).
3. **Framework Preset**: Next.js (avtomatik aniqlanadi).
4. **Environment Variables**:
   ```
   BOT_TOKEN=<BotFather tokeni>
   ADMIN_CHAT_ID=<sizning Telegram chat ID>
   ```
5. **Deploy** ni bosing.

Deploy tugagach sizga `https://<loyiha-nomi>.vercel.app` manzili beriladi — shu saytga mijoz kirib brifni to'ldiradi.

## Savollarni tahrirlash

Savollar va ТЗ shabloni `lib/questions.js` faylida. `tz-bot/questions.py` bilan bir xil bo'lishini istasangiz, ikkala faylni birga yangilang.

## Arxitektura

- `app/page.jsx` — asosiy sahifa, `BriefWizard` komponentini render qiladi.
- `components/BriefWizard.jsx` — savol-javob oqimi (client component): matn kiritish, `MediaRecorder` orqali ovoz yozish, progress bar.
- `app/api/submit/route.js` — Vercel serverless funksiya (Node runtime): javoblarni qabul qiladi, ТЗ shablonini to'ldiradi, Telegram Bot API orqali admin chatga yuboradi.
- `lib/telegram.js` — Telegram Bot API bilan ishlash (uzun xabarni bo'lish, ovoz faylini `sendDocument` bilan yuborish).

Ovozli javoblar Telegram'ga **hujjat** (`sendDocument`) sifatida yuboriladi — brauzer `MediaRecorder`'i odatda `webm/opus` formatida yozadi, bu esa Telegramning "ovozli xabar" pufakchasi talab qiladigan `ogg/opus` konteyneridan farq qiladi. Hujjat sifatida yuborish har doim ishlashini kafolatlaydi; admin faylni yuklab olib eshitishi mumkin.
