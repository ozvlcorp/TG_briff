from dataclasses import dataclass


@dataclass(frozen=True)
class Question:
    key: str
    text: str
    hint: str | None = None


QUESTIONS: list[Question] = [
    Question(
        key="company_sector",
        text="1/17. Kompaniyangiz nomi va sohasi qanday? Qisqacha ayting.",
        hint="Masalan: \"Baraka Market\" — chakana savdo (oziq-ovqat).",
    ),
    Question(
        key="employees",
        text="2/17. Xodimlaringiz soni qancha?",
        hint="Taxminiy raqam ham bo'ladi (masalan: 25 nafar).",
    ),
    Question(
        key="locations",
        text="3/17. Nechta do'kon/nuqta/ofisingiz bor va qaysi shaharlarda?",
        hint="Masalan: 3 ta do'kon — Toshkent, Samarqand.",
    ),
    Question(
        key="current_systems",
        text="4/17. Hozir qanday tizimlarda ishlaysiz? (buxgalteriya, ombor, CRM)",
        hint="Masalan: 1C, МойСклад, Didox, Excel, Google Sheets.",
    ),
    Question(
        key="scope",
        text="5/17. Sizga qaysi biri kerak: HR-agent, moliya-agent, yoki ikkalasi?",
        hint="Ikkalasini birga tanlash mumkin.",
    ),
    Question(
        key="hr_modules",
        text="6/17. HR bo'yicha qaysi vazifalarni avtomatlashtirmoqchisiz?",
        hint="Recruitment (vakansiya, CV, intervyu) / Xodimlar bazasi / KPI / O'quv / Hujjatlar / Analitika / Davomat / Motivatsiya. Kerakligini sanab bering.",
    ),
    Question(
        key="hr_volume",
        text="7/17. Oyiga taxminan nechta vakansiya va nechta HR-hujjat bor?",
        hint="Masalan: 5 vakansiya, 20 shartnoma/buyruq. Bilmasangiz — \"bilmayman\" deb yozing.",
    ),
    Question(
        key="fin_functions",
        text="8/17. Moliya bo'yicha qaysi vazifalarni avtomatlashtirmoqchisiz?",
        hint="Daromad-xarajat / Cash flow / Budjet / Foyda tahlili / Qarzdorlar / Soliq / Prognoz / Dashboard / AI-tavsiyalar. Kerakligini sanab bering.",
    ),
    Question(
        key="fin_system",
        text="9/17. Buxgalteriyangiz qayerda yuritiladi?",
        hint="1C / Didox / Excel / boshqa. Yoki alohida buxgalter bormi?",
    ),
    Question(
        key="payments",
        text="10/17. Qaysi banklar va to'lov tizimlari bilan integratsiya kerak?",
        hint="Payme, Click, Uzum, Kapitalbank, Anorbank, Ipoteka, Xalq bank va h.k.",
    ),
    Question(
        key="other_integrations",
        text="11/17. Boshqa qanday integratsiyalar kerak?",
        hint="Google Sheets, Soliq API, Didox, Telegram-guruhlar, saytingiz va h.k.",
    ),
    Question(
        key="channels",
        text="12/17. Foydalanuvchilar agentdan qaysi kanal orqali foydalanadi?",
        hint="Telegram / veb-sayt / mobil ilova. Bittasi yoki bir nechtasi.",
    ),
    Question(
        key="languages",
        text="13/17. Qaysi tillarda ishlashi kerak?",
        hint="UZ / RU / EN. Bittasi yoki bir nechtasi.",
    ),
    Question(
        key="hosting",
        text="14/17. Tizim qayerda joylashsin?",
        hint="Bulut (biz hosting bilan ta'minlaymiz) yoki o'z serveringizda.",
    ),
    Question(
        key="roles_security",
        text="15/17. Kim foydalanadi va nimani himoya qilish muhim?",
        hint="Masalan: direktor + HR + buxgalter. Maosh ma'lumoti faqat direktorga ko'rinadi va h.k.",
    ),
    Question(
        key="deadline",
        text="16/17. Loyihaning kutilgan muddati qancha?",
        hint="Masalan: 2 oy ichida MVP, keyin bosqichma-bosqich.",
    ),
    Question(
        key="budget",
        text="17/17. Byudjet doirasi qanday? (ixtiyoriy)",
        hint="Aytishni istamasangiz \"o'tkazib yuborish\" tugmasini bosing.",
    ),
]


TZ_TEMPLATE = """📋 TEXNIK TOPSHIRIQ — AI-agentlar

1. Kompaniya profili
   • Nomi va sohasi: {company_sector}
   • Xodimlar soni: {employees}
   • Do'kon/nuqta va shaharlar: {locations}
   • Hozirgi tizimlar: {current_systems}

2. Yechim doirasi (HR / Moliya / ikkalasi): {scope}

3. HR-agent
   • Kerakli modullar: {hr_modules}
   • Hajm (vakansiya/hujjat/oy): {hr_volume}

4. Moliya-agent
   • Kerakli funksiyalar: {fin_functions}
   • Buxgalteriya tizimi: {fin_system}

5. Integratsiyalar
   • Bank/to'lov: {payments}
   • Boshqa: {other_integrations}

6. Kanallar va tillar
   • Kanallar: {channels}
   • Tillar: {languages}

7. Ma'lumot va xavfsizlik
   • Joylashuv: {hosting}
   • Rollar/himoya: {roles_security}

8. Muddat va byudjet
   • Muddat: {deadline}
   • Byudjet: {budget}

9. Keyingi qadam
   Ozvlcorp jamoasi ushbu brif asosida taklif va aniq narx tuzib beradi. 24 soat ichida bog'lanamiz."""
