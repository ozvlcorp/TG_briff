import asyncio
import logging

from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import Command, CommandStart
from aiogram.types import KeyboardButton, ReplyKeyboardMarkup, ReplyKeyboardRemove

from admin import build_filled_tz, send_final_brief
from config import BOT_TOKEN
from questions import QUESTIONS
from session import Answer, Session, get, get_or_create, reset
from utils import split_long_message

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger("tz-bot")

BTN_SKIP = "⏭ O'tkazib yuborish"
BTN_BACK = "⬅️ Orqaga"
BTN_FINISH = "✅ Tugatish"
BTN_CANCEL = "❌ Bekor qilish"

CONTROL_BUTTONS = {BTN_SKIP, BTN_BACK, BTN_FINISH, BTN_CANCEL}


def brief_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=BTN_SKIP), KeyboardButton(text=BTN_BACK)],
            [KeyboardButton(text=BTN_FINISH), KeyboardButton(text=BTN_CANCEL)],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
    )


WELCOME_TEXT = (
    "Assalomu alaykum! 👋\n\n"
    "Men — Ozvlcorp agentligining brif-botiman. Sizga HR yoki moliya "
    "bo'yicha AI-agent qurish uchun qisqacha savollar beraman.\n\n"
    "📝 Har savolga *matn* yoki *ovoz* bilan javob bering — istaganingizcha.\n"
    "⏭ Javob berishni istamasangiz — \"O'tkazib yuborish\".\n"
    "⬅️ Xato javob bergan bo'lsangiz — \"Orqaga\".\n"
    "✅ Erta yakunlamoqchi bo'lsangiz — \"Tugatish\".\n"
    "❌ Bekor qilish uchun — \"Bekor qilish\" yoki /reset.\n\n"
    "Boshlaymizmi? Birinchi savol pastda 👇"
)


def _format_question(session: Session) -> str | None:
    q = session.current_question()
    if q is None:
        return None
    text = f"❓ *{q.text}*"
    if q.hint:
        text += f"\n\n_{q.hint}_"
    return text


async def _ask_current(message: types.Message, session: Session) -> None:
    text = _format_question(session)
    if text is None:
        await _finalize(message, session)
        return
    await message.answer(text, reply_markup=brief_keyboard(), parse_mode="Markdown")


async def _finalize(message: types.Message, session: Session) -> None:
    session.done = True
    filled_tz = build_filled_tz(session)

    thanks = (
        "Rahmat! Brif tayyor 🎉\n\n"
        "Quyida to'plagan ma'lumotlar asosida yakuniy ТЗ. "
        "Ovozli javoblaringiz jamoamizga alohida yuborildi.\n"
        "24 soat ichida siz bilan bog'lanamiz."
    )
    await message.answer(thanks, reply_markup=ReplyKeyboardRemove())
    for chunk in split_long_message(filled_tz):
        await message.answer(chunk)

    try:
        await send_final_brief(message.bot, session)
    except Exception:
        log.exception("Failed to send brief to admin")
        await message.answer(
            "⚠️ Ma'lumot jamoamizga yuborishda muammo bo'ldi. "
            "Iltimos, biroz kuting yoki keyinroq /start bilan qayta urinib ko'ring."
        )


def _display_name(user: types.User) -> str:
    parts = [user.first_name or "", user.last_name or ""]
    name = " ".join(p for p in parts if p).strip()
    return name or (user.username or f"user{user.id}")


dp = Dispatcher()


@dp.message(CommandStart())
async def handle_start(message: types.Message) -> None:
    user = message.from_user
    session = reset(user.id, user.username, _display_name(user))
    await message.answer(WELCOME_TEXT, parse_mode="Markdown")
    await _ask_current(message, session)


@dp.message(Command("reset"))
async def handle_reset(message: types.Message) -> None:
    user = message.from_user
    reset(user.id, user.username, _display_name(user))
    await message.answer(
        "Sessiya tozalandi. Yangi brif boshlash uchun /start ni bosing.",
        reply_markup=ReplyKeyboardRemove(),
    )


@dp.message(Command("help"))
async def handle_help(message: types.Message) -> None:
    await message.answer(
        "Buyruqlar:\n"
        "/start — brifni boshlash yoki qaytadan boshlash\n"
        "/reset — hozirgi sessiyani tozalash\n"
        "/help — ushbu ma'lumot\n\n"
        f"{BTN_SKIP} — hozirgi savolni o'tkazib yuborish\n"
        f"{BTN_BACK} — oldingi savolga qaytish\n"
        f"{BTN_FINISH} — barcha javoblarni yakunlash\n"
        f"{BTN_CANCEL} — bekor qilish"
    )


def _ensure_active_session(message: types.Message) -> Session | None:
    session = get(message.from_user.id)
    if session is None or session.done:
        return None
    return session


@dp.message(F.text == BTN_SKIP)
async def handle_skip(message: types.Message) -> None:
    session = _ensure_active_session(message)
    if session is None:
        await message.answer("Sessiya faol emas. /start ni bosing.")
        return
    session.record(Answer(kind="skipped"))
    session.advance()
    await _ask_current(message, session)


@dp.message(F.text == BTN_BACK)
async def handle_back(message: types.Message) -> None:
    session = _ensure_active_session(message)
    if session is None:
        await message.answer("Sessiya faol emas. /start ni bosing.")
        return
    if not session.go_back():
        await message.answer("Bu birinchi savol — orqaga qaytishning imkoni yo'q.")
        return
    await _ask_current(message, session)


@dp.message(F.text == BTN_FINISH)
async def handle_finish(message: types.Message) -> None:
    session = _ensure_active_session(message)
    if session is None:
        await message.answer("Sessiya faol emas. /start ni bosing.")
        return
    await _finalize(message, session)


@dp.message(F.text == BTN_CANCEL)
async def handle_cancel(message: types.Message) -> None:
    user = message.from_user
    reset(user.id, user.username, _display_name(user))
    await message.answer(
        "Bekor qilindi. Qaytadan boshlash uchun /start ni bosing.",
        reply_markup=ReplyKeyboardRemove(),
    )


@dp.message(F.voice)
async def handle_voice(message: types.Message) -> None:
    user = message.from_user
    session = get_or_create(user.id, user.username, _display_name(user))
    if session.is_finished():
        await message.answer("Brif allaqachon yakunlangan. Yangisi uchun /start ni bosing.")
        return
    session.record(
        Answer(
            kind="voice",
            file_id=message.voice.file_id,
            duration=message.voice.duration,
        )
    )
    session.advance()
    if session.is_finished():
        await _finalize(message, session)
    else:
        await message.answer("Ovoz qabul qilindi ✅")
        await _ask_current(message, session)


@dp.message(F.audio)
async def handle_audio(message: types.Message) -> None:
    user = message.from_user
    session = get_or_create(user.id, user.username, _display_name(user))
    if session.is_finished():
        await message.answer("Brif allaqachon yakunlangan. Yangisi uchun /start ni bosing.")
        return
    session.record(
        Answer(
            kind="voice",
            file_id=message.audio.file_id,
            duration=message.audio.duration,
        )
    )
    session.advance()
    if session.is_finished():
        await _finalize(message, session)
    else:
        await message.answer("Audio qabul qilindi ✅")
        await _ask_current(message, session)


@dp.message(F.text)
async def handle_text(message: types.Message) -> None:
    text = (message.text or "").strip()
    if not text:
        return
    if text in CONTROL_BUTTONS:
        return
    if text.startswith("/"):
        await message.answer(
            "Bunday buyruq yo'q. /help ni bosib ro'yxatni ko'rishingiz mumkin."
        )
        return

    user = message.from_user
    session = get_or_create(user.id, user.username, _display_name(user))
    if session.is_finished():
        await message.answer("Brif allaqachon yakunlangan. Yangisi uchun /start ni bosing.")
        return

    session.record(Answer(kind="text", text=text))
    session.advance()
    if session.is_finished():
        await _finalize(message, session)
    else:
        await _ask_current(message, session)


@dp.message()
async def handle_other(message: types.Message) -> None:
    await message.answer(
        "Iltimos, matn yoki ovozli xabar yuboring. "
        "Rasm, video va fayllarni hozircha qabul qila olmayman."
    )


async def _log_startup(bot: Bot) -> None:
    me = await bot.get_me()
    log.info("Bot started as @%s (id=%s); %d ta savol yuklandi", me.username, me.id, len(QUESTIONS))


async def main() -> None:
    bot = Bot(token=BOT_TOKEN)
    await _log_startup(bot)
    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
