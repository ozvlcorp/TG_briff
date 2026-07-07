# tz-bot — Ozvlcorp brif-bot

Ozvlcorp agentligi uchun HR va moliya AI-agentlar bo'yicha brif yig'ish boti.
Mijoz Telegram'da `/start` bosadi, ketma-ket 17 ta savolga **matn** yoki **ovozli xabar** bilan javob beradi. Oxirida bot tayyor texnik topshiriq (ТЗ) chiqaradi va uni adminga (bizga) yuboradi — ovozli javoblar ham alohida yetkaziladi.

## Xususiyatlari

- 17 ta chiziqli savol (kompaniya profili, HR, moliya, integratsiyalar, xavfsizlik, muddat).
- Har savolga matn yoki ovoz bilan javob berish mumkin.
- ⏭ o'tkazib yuborish, ⬅️ orqaga qaytish, ✅ erta tugatish, ❌ bekor qilish tugmalari.
- Yakunda: mijozga to'ldirilgan ТЗ, adminga ТЗ + barcha ovozli fayllar.
- Hech qanday LLM/OpenAI kerak emas — faqat Telegram Bot API.

## Talablar

- Python 3.11+
- BotFather'dan olingan bot tokeni
- Admin chat ID (o'zingizning ID'ingiz yoki guruh ID'si — `@userinfobot` orqali topsangiz bo'ladi)

## Ishga tushirish (lokal)

```bash
cd tz-bot
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# .env ichiga BOT_TOKEN va ADMIN_CHAT_ID ni yozing

python bot.py
```

Telegram'da botga `/start` yuboring — birinchi savol chiqishi kerak.

## Buyruqlar

- `/start` — brifni boshlash yoki qaytadan boshlash
- `/reset` — hozirgi sessiyani tozalash
- `/help` — buyruqlar ro'yxati

## Savollarni tahrirlash

Barcha savollar `questions.py` faylining `QUESTIONS` ro'yxatida. Yangi savol qo'shish yoki matnni o'zgartirish uchun shu ro'yxatni tahrir qiling. Yakuniy ТЗ shabloni ham shu faylda (`TZ_TEMPLATE`) — yangi `{slot}` qo'shsangiz, `questions.py` da mos `key` bilan savol qo'shing.

## Deploy (Dokploy — o'z serveringizda)

Loyihada `Dockerfile` bor, shuning uchun Dokploy botni to'g'ridan-to'g'ri build qilib ishlatadi. Bot long-polling ishlaydi — port ochish shart emas.

1. Dokploy panelida yangi **Application** yarating.
2. **Provider**: GitHub → `ozvlcorp/TG_briff` reposini ulang, branch: `claude/hr-finance-telegram-bot-qujm37` (yoki merge qilingach `main`).
3. **Build Type**: `Dockerfile`.
4. **Docker Context / Build Path**: `tz-bot` (Dockerfile shu papkada).
5. **Environment Variables** bo'limiga qo'shing:
   ```
   BOT_TOKEN=<BotFather tokeni>
   ADMIN_CHAT_ID=<sizning chat ID>
   ```
6. **Port**: kerak emas (bu veb-server emas, worker). Domain/port sozlashni o'tkazib yuboring.
7. **Deploy** ni bosing.

Deploy tugagach, loglar (Logs bo'limi) da quyidagi qatorni ko'rishingiz kerak:
```
Bot started as @<bot_username> ...
```
Shundan keyin Telegram'da botga `/start` yuboring — ishlashi kerak.

> **Lokal tekshirish (ixtiyoriy):** `docker build -t tz-bot ./tz-bot && docker run --env-file tz-bot/.env tz-bot`

## Deploy (Railway / Render)

**Railway.**

1. Yangi loyiha yarating, GitHub repo bilan bog'lang.
2. Root katalog sifatida `tz-bot/` ni ko'rsating.
3. Environment sozlamalariga `BOT_TOKEN` va `ADMIN_CHAT_ID` ni qo'shing.
4. Start Command: `python bot.py`
5. Deploy.

**Render.**

- Yangi *Background Worker* xizmati.
- Build: `pip install -r requirements.txt`
- Start: `python bot.py`
- Env vars: `BOT_TOKEN`, `ADMIN_CHAT_ID`.

## Eslatma

Sessiyalar xotirada saqlanadi — bot restart bo'lsa, davom etayotgan sessiyalar yo'qoladi. Odatda brif bir seansda tugaydi, shuning uchun MVP uchun bu yetarli. Uzoq muddatli saqlash kerak bo'lsa, `session.py` ni SQLite'ga o'tkazish oson.
