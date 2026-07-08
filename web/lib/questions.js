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
    hint: "Pastdagi tugmalardan birini tanlang yoki o'z so'zingiz bilan yozing.",
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

// 5-savolga tugma orqali beriladigan tayyor javoblar. Matn har doim
// classifyScope() orqali o'qiladi, shuning uchun mijoz o'z so'zi bilan
// yozsa ham (masalan "faqat HR kerak") to'g'ri aniqlanadi.
export const SCOPE_CHOICES = ["HR", "Moliya", "HR + Moliya"];

const HR_KEYWORDS = ["hr", "кадр", "ходим", "hodim"];
const FINANCE_KEYWORDS = ["moliya", "молия", "финанс", "financ", "buxgalter", "бухгалт"];

// Erkin matnni "hr" | "finance" | "both" ga aylantiradi. Noaniq yoki bo'sh
// javob xavfsiz tomonga — "both" ga tushadi, shunda ТЗda hech qanday
// bo'lim yo'qolmaydi.
export function classifyScope(text) {
  if (!text) return "both";
  const t = text.toLowerCase();
  const hasHr = HR_KEYWORDS.some((k) => t.includes(k));
  const hasFin = FINANCE_KEYWORDS.some((k) => t.includes(k));
  if (hasHr && hasFin) return "both";
  if (hasHr) return "hr";
  if (hasFin) return "finance";
  return "both";
}

const VOICE_PLACEHOLDER = "[🎤 Ovozli javob — audio adminga alohida yuborildi]";
const SKIPPED_PLACEHOLDER = "— (o'tkazib yuborildi)";
const NO_ANSWER_PLACEHOLDER = "— (javob berilmagan)";

function slotValue(answers, key) {
  const answer = answers[key];
  if (!answer) return NO_ANSWER_PLACEHOLDER;
  if (answer.kind === "voice") return VOICE_PLACEHOLDER;
  if (answer.kind === "skipped") return SKIPPED_PLACEHOLDER;
  if (answer.kind === "text") return (answer.text || "").trim() || NO_ANSWER_PLACEHOLDER;
  return NO_ANSWER_PLACEHOLDER;
}

// Yakuniy ТЗ matnini quradi; scopeKind ga qarab HR/Moliya bo'limlarini
// qo'shadi yoki tashlab ketadi, qolgan bo'limlarni qayta raqamlaydi.
export function renderTz(answers, scopeKind) {
  const v = (key) => slotValue(answers, key);
  const lines = ["📋 TEXNIK TOPSHIRIQ — AI-agentlar", ""];

  lines.push("1. Kompaniya profili");
  lines.push(`   • Nomi va sohasi: ${v("company_sector")}`);
  lines.push(`   • Xodimlar soni: ${v("employees")}`);
  lines.push(`   • Do'kon/nuqta va shaharlar: ${v("locations")}`);
  lines.push(`   • Hozirgi tizimlar: ${v("current_systems")}`);
  lines.push("");

  lines.push(`2. Yechim doirasi (HR / Moliya / ikkalasi): ${v("scope")}`);
  lines.push("");

  let sectionNum = 3;

  if (scopeKind === "hr" || scopeKind === "both") {
    lines.push(`${sectionNum}. HR-agent`);
    lines.push(`   • Kerakli modullar: ${v("hr_modules")}`);
    lines.push(`   • Hajm (vakansiya/hujjat/oy): ${v("hr_volume")}`);
    lines.push("");
    sectionNum += 1;
  }

  if (scopeKind === "finance" || scopeKind === "both") {
    lines.push(`${sectionNum}. Moliya-agent`);
    lines.push(`   • Kerakli funksiyalar: ${v("fin_functions")}`);
    lines.push(`   • Buxgalteriya tizimi: ${v("fin_system")}`);
    lines.push("");
    sectionNum += 1;
  }

  lines.push(`${sectionNum}. Integratsiyalar`);
  lines.push(`   • Bank/to'lov: ${v("payments")}`);
  lines.push(`   • Boshqa: ${v("other_integrations")}`);
  lines.push("");
  sectionNum += 1;

  lines.push(`${sectionNum}. Kanallar va tillar`);
  lines.push(`   • Kanallar: ${v("channels")}`);
  lines.push(`   • Tillar: ${v("languages")}`);
  lines.push("");
  sectionNum += 1;

  lines.push(`${sectionNum}. Ma'lumot va xavfsizlik`);
  lines.push(`   • Joylashuv: ${v("hosting")}`);
  lines.push(`   • Rollar/himoya: ${v("roles_security")}`);
  lines.push("");
  sectionNum += 1;

  lines.push(`${sectionNum}. Muddat va byudjet`);
  lines.push(`   • Muddat: ${v("deadline")}`);
  lines.push(`   • Byudjet: ${v("budget")}`);
  lines.push("");
  sectionNum += 1;

  lines.push(`${sectionNum}. Keyingi qadam`);
  lines.push(
    "   Ozvlcorp jamoasi ushbu brif asosida taklif va aniq narx tuzib beradi. 24 soat ichida bog'lanamiz."
  );

  return lines.join("\n");
}
