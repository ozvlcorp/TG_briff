from aiogram import Bot

from config import ADMIN_CHAT_ID
from questions import QUESTIONS, classify_scope, render_tz
from session import Session
from utils import split_long_message


VOICE_PLACEHOLDER = "[🎤 Ovozli javob — audio adminga alohida yuborildi]"
SKIPPED_PLACEHOLDER = "— (o'tkazib yuborildi)"
NO_ANSWER_PLACEHOLDER = "— (javob berilmagan)"


def _slot_value(session: Session, key: str) -> str:
    answer = session.answers.get(key)
    if answer is None:
        return NO_ANSWER_PLACEHOLDER
    if answer.kind == "skipped":
        return SKIPPED_PLACEHOLDER
    if answer.kind == "voice":
        return VOICE_PLACEHOLDER
    return (answer.text or "").strip() or NO_ANSWER_PLACEHOLDER


def build_filled_tz(session: Session) -> str:
    values = {q.key: _slot_value(session, q.key) for q in QUESTIONS}
    scope_answer = session.answers.get("scope")
    scope_text = scope_answer.text if scope_answer and scope_answer.kind == "text" else None
    scope_kind = classify_scope(scope_text)
    return render_tz(values, scope_kind)


def _client_header(session: Session) -> str:
    username = f"@{session.username}" if session.username else "(username yo'q)"
    started = session.started_at.strftime("%Y-%m-%d %H:%M UTC")
    return (
        f"👤 Yangi brif\n"
        f"Ism: {session.full_name}\n"
        f"Username: {username}\n"
        f"User ID: {session.user_id}\n"
        f"Boshlangan: {started}"
    )


async def send_final_brief(bot: Bot, session: Session) -> None:
    filled_tz = build_filled_tz(session)

    header = _client_header(session)
    intro = f"{header}\n\n--- Tayyor ТЗ ---\n\n{filled_tz}"
    for chunk in split_long_message(intro):
        await bot.send_message(chat_id=ADMIN_CHAT_ID, text=chunk)

    voice_answers = [
        (i, q, session.answers[q.key])
        for i, q in enumerate(QUESTIONS, start=1)
        if q.key in session.answers and session.answers[q.key].kind == "voice"
    ]
    if not voice_answers:
        return

    await bot.send_message(
        chat_id=ADMIN_CHAT_ID,
        text=f"🎤 Ovozli javoblar: {len(voice_answers)} ta",
    )
    for num, question, answer in voice_answers:
        caption = f"Savol {num}. {question.text}"
        if len(caption) > 1024:
            caption = caption[:1021] + "..."
        try:
            await bot.send_voice(
                chat_id=ADMIN_CHAT_ID,
                voice=answer.file_id,
                caption=caption,
            )
        except Exception:
            await bot.send_message(
                chat_id=ADMIN_CHAT_ID,
                text=f"⚠️ {caption}\n(ovoz faylini yuborib bo'lmadi, file_id: {answer.file_id})",
            )
