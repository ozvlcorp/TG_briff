export const QUESTIONS = [
  {
    key: "company_sector",
    text: "Kompaniyangiz nomi va sohasi qanday?",
    hint: 'Masalan: "Baraka Market" — chakana savdo (oziq-ovqat).',
  },
  {
    key: "employees",
    text: "Xodimlaringiz soni qancha?",
    hint: "Taxminiy raqam ham bo'ladi (masalan: 25 nafar).",
  },
  {
    key: "locations",
    text: "Nechta do'kon/nuqta/ofisingiz bor va qaysi shaharlarda?",
    hint: "Masalan: 3 ta do'kon — Toshkent, Samarqand.",
  },
  {
    key: "current_systems",
    text: "Hozir qanday tizimlarda ishlaysiz? (buxgalteriya, ombor, CRM)",
    hint: "Masalan: 1C, МойСклад, Didox, Excel, Google Sheets.",
  },
  {
    key: "scope",
    text: "Sizga qaysi biri kerak: HR-agent, moliya-agent, yoki ikkalasi?",
    hint: "Ikkalasini birga tanlash mumkin.",
  },
  {
    key: "hr_modules",
    text: "HR bo'yicha qaysi vazifalarni avtomatlashtirmoqchisiz?",
    hint: "Recruitment (vakansiya, CV, intervyu) / Xodimlar bazasi / KPI / O'quv / Hujjatlar / Analitika / Davomat / Motivatsiya. Kerakligini sanab bering.",
  },
  {
    key: "hr_volume",
    text: "Oyiga taxminan nechta vakansiya va nechta HR-hujjat bor?",
    hint: 'Masalan: 5 vakansiya, 20 shartnoma/buyruq. Bilmasangiz — "bilmayman" deb yozing.',
  },
  {
    key: "fin_functions",
    text: "Moliya bo'yicha qaysi vazifalarni avtomatlashtirmoqchisiz?",
    hint: "Daromad-xarajat / Cash flow / Budjet / Foyda tahlili / Qarzdorlar / Soliq / Prognoz / Dashboard / AI-tavsiyalar. Kerakligini sanab bering.",
  },
  {
    key: "fin_system",
    text: "Buxgalteriyangiz qayerda yuritiladi?",
    hint: "1C / Didox / Excel / boshqa. Yoki alohida buxgalter bormi?",
  },
  {
    key: "payments",
    text: "Qaysi banklar va to'lov tizimlari bilan integratsiya kerak?",
    hint: "Payme, Click, Uzum, Kapitalbank, Anorbank, Ipoteka, Xalq bank va h.k.",
  },
  {
    key: "other_integrations",
    text: "Boshqa qanday integratsiyalar kerak?",
    hint: "Google Sheets, Soliq API, Didox, Telegram-guruhlar, saytingiz va h.k.",
  },
  {
    key: "channels",
    text: "Foydalanuvchilar agentdan qaysi kanal orqali foydalanadi?",
    hint: "Telegram / veb-sayt / mobil ilova. Bittasi yoki bir nechtasi.",
  },
  {
    key: "languages",
    text: "Qaysi tillarda ishlashi kerak?",
    hint: "UZ / RU / EN. Bittasi yoki bir nechtasi.",
  },
  {
    key: "hosting",
    text: "Tizim qayerda joylashsin?",
    hint: "Bulut (biz hosting bilan ta'minlaymiz) yoki o'z serveringizda.",
  },
  {
    key: "roles_security",
    text: "Kim foydalanadi va nimani himoya qilish muhim?",
    hint: "Masalan: direktor + HR + buxgalter. Maosh ma'lumoti faqat direktorga ko'rinadi va h.k.",
  },
  {
    key: "deadline",
    text: "Loyihaning kutilgan muddati qancha?",
    hint: "Masalan: 2 oy ichida MVP, keyin bosqichma-bosqich.",
  },
  {
    key: "budget",
    text: "Byudjet doirasi qanday? (ixtiyoriy)",
    hint: 'Aytishni istamasangiz "O\'tkazib yuborish" tugmasini bosing.',
  },
];

export const TZ_TEMPLATE = `📋 TEXNIK TOPSHIRIQ — AI-agentlar

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
   Ozvlcorp jamoasi ushbu brif asosida taklif va aniq narx tuzib beradi. 24 soat ichida bog'lanamiz.`;

const VOICE_PLACEHOLDER = "[🎤 Ovozli javob — audio adminga alohida yuborildi]";
const SKIPPED_PLACEHOLDER = "— (o'tkazib yuborildi)";
const NO_ANSWER_PLACEHOLDER = "— (javob berilmagan)";

export function fillTemplate(answers) {
  let result = TZ_TEMPLATE;
  for (const q of QUESTIONS) {
    const answer = answers[q.key];
    let value = NO_ANSWER_PLACEHOLDER;
    if (answer) {
      if (answer.kind === "voice") value = VOICE_PLACEHOLDER;
      else if (answer.kind === "skipped") value = SKIPPED_PLACEHOLDER;
      else if (answer.kind === "text") value = (answer.text || "").trim() || NO_ANSWER_PLACEHOLDER;
    }
    result = result.replaceAll(`{${q.key}}`, value);
  }
  return result;
}
