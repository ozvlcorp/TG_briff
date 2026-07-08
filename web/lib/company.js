// Kompaniya ma'lumotlari — bir joyda. O'zgartirish uchun faqat shu qiymatlarni tahrirlang.
// TODO: quyidagi kontaktlarni haqiqiy ma'lumotlaringiz bilan almashtiring.
export const COMPANY = {
  name: "OY",
  fullName: "OY — Hammasi shaffof tizim yaratamiz",
  tagline: "Hammasi shaffof tizim yaratamiz",
  phone: "+998 __ ___ __ __",
  telegram: "@oy_agency",
  website: "oy.uz",
  email: "info@oy.uz",
};

// Bo'sh/placeholder kontaktlarni ko'rsatmaslik uchun yordamchi.
export function companyContacts() {
  const items = [];
  if (COMPANY.phone && !COMPANY.phone.includes("__")) items.push({ label: "Tel", value: COMPANY.phone });
  if (COMPANY.telegram && !COMPANY.telegram.includes("oy_agency")) items.push({ label: "Telegram", value: COMPANY.telegram });
  if (COMPANY.website && !COMPANY.website.includes("oy.uz")) items.push({ label: "Sayt", value: COMPANY.website });
  if (COMPANY.email && !COMPANY.email.includes("oy.uz")) items.push({ label: "Email", value: COMPANY.email });
  return items;
}
