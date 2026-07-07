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
        hint="Pastdagi tugmalardan birini bosing yoki o'z so'zingiz bilan yozing.",
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


# 5/17 savoliga tugma orqali beriladigan tayyor javoblar. Matn har doim
# classify_scope() orqali o'qiladi, shuning uchun mijoz o'z so'zi bilan
# yozsa ham (masalan "faqat HR kerak") to'g'ri aniqlanadi.
SCOPE_CHOICES = ["HR", "Moliya", "HR + Moliya"]

_HR_KEYWORDS = ("hr", "кадр", "ходим", "hodim")
_FINANCE_KEYWORDS = ("moliya", "молия", "финанс", "financ", "buxgalter", "бухгалт")


def classify_scope(text: str | None) -> str:
    """Erkin matnni 'hr' | 'finance' | 'both' ga aylantiradi.

    Noaniq yoki bo'sh javob (ovozli/o'tkazib yuborilgan) xavfsiz tomonga —
    'both' ga tushadi, shunda ТЗda hech qanday bo'lim yo'qolmaydi.
    """
    if not text:
        return "both"
    t = text.lower()
    has_hr = any(k in t for k in _HR_KEYWORDS)
    has_fin = any(k in t for k in _FINANCE_KEYWORDS)
    if has_hr and has_fin:
        return "both"
    if has_hr:
        return "hr"
    if has_fin:
        return "finance"
    return "both"


def render_tz(values: dict[str, str], scope_kind: str) -> str:
    """Yakuniy ТЗ matnini quradi; scope_kind ga qarab HR/Moliya bo'limlarini
    qo'shadi yoki tashlab ketadi, qolgan bo'limlarni qayta raqamlaydi."""
    lines = ["📋 TEXNIK TOPSHIRIQ — AI-agentlar", ""]

    lines.append("1. Kompaniya profili")
    lines.append(f"   • Nomi va sohasi: {values['company_sector']}")
    lines.append(f"   • Xodimlar soni: {values['employees']}")
    lines.append(f"   • Do'kon/nuqta va shaharlar: {values['locations']}")
    lines.append(f"   • Hozirgi tizimlar: {values['current_systems']}")
    lines.append("")

    lines.append(f"2. Yechim doirasi (HR / Moliya / ikkalasi): {values['scope']}")
    lines.append("")

    section_num = 3

    if scope_kind in ("hr", "both"):
        lines.append(f"{section_num}. HR-agent")
        lines.append(f"   • Kerakli modullar: {values['hr_modules']}")
        lines.append(f"   • Hajm (vakansiya/hujjat/oy): {values['hr_volume']}")
        lines.append("")
        section_num += 1

    if scope_kind in ("finance", "both"):
        lines.append(f"{section_num}. Moliya-agent")
        lines.append(f"   • Kerakli funksiyalar: {values['fin_functions']}")
        lines.append(f"   • Buxgalteriya tizimi: {values['fin_system']}")
        lines.append("")
        section_num += 1

    lines.append(f"{section_num}. Integratsiyalar")
    lines.append(f"   • Bank/to'lov: {values['payments']}")
    lines.append(f"   • Boshqa: {values['other_integrations']}")
    lines.append("")
    section_num += 1

    lines.append(f"{section_num}. Kanallar va tillar")
    lines.append(f"   • Kanallar: {values['channels']}")
    lines.append(f"   • Tillar: {values['languages']}")
    lines.append("")
    section_num += 1

    lines.append(f"{section_num}. Ma'lumot va xavfsizlik")
    lines.append(f"   • Joylashuv: {values['hosting']}")
    lines.append(f"   • Rollar/himoya: {values['roles_security']}")
    lines.append("")
    section_num += 1

    lines.append(f"{section_num}. Muddat va byudjet")
    lines.append(f"   • Muddat: {values['deadline']}")
    lines.append(f"   • Byudjet: {values['budget']}")
    lines.append("")
    section_num += 1

    lines.append(f"{section_num}. Keyingi qadam")
    lines.append(
        "   Ozvlcorp jamoasi ushbu brif asosida taklif va aniq narx tuzib beradi. "
        "24 soat ichida bog'lanamiz."
    )

    return "\n".join(lines)
