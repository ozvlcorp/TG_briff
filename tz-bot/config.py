import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID")

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN environment variable is required")
if not ADMIN_CHAT_ID:
    raise RuntimeError("ADMIN_CHAT_ID environment variable is required")

try:
    ADMIN_CHAT_ID = int(ADMIN_CHAT_ID)
except ValueError:
    raise RuntimeError("ADMIN_CHAT_ID must be an integer chat id")

TELEGRAM_MESSAGE_LIMIT = 4096
