from dataclasses import dataclass, field
from datetime import datetime, timezone

from questions import QUESTIONS


@dataclass
class Answer:
    kind: str  # "text" | "voice" | "skipped"
    text: str | None = None
    file_id: str | None = None
    duration: int | None = None


@dataclass
class Session:
    user_id: int
    username: str | None
    full_name: str
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    idx: int = 0
    answers: dict[str, Answer] = field(default_factory=dict)
    done: bool = False

    def current_question(self):
        if self.idx >= len(QUESTIONS):
            return None
        return QUESTIONS[self.idx]

    def is_last(self) -> bool:
        return self.idx >= len(QUESTIONS) - 1

    def is_finished(self) -> bool:
        return self.idx >= len(QUESTIONS)

    def advance(self) -> None:
        self.idx += 1

    def go_back(self) -> bool:
        if self.idx == 0:
            return False
        self.idx -= 1
        current = QUESTIONS[self.idx]
        self.answers.pop(current.key, None)
        return True

    def record(self, answer: Answer) -> None:
        q = self.current_question()
        if q is None:
            return
        self.answers[q.key] = answer


SESSIONS: dict[int, Session] = {}


def get_or_create(user_id: int, username: str | None, full_name: str) -> Session:
    session = SESSIONS.get(user_id)
    if session is None or session.done:
        session = Session(user_id=user_id, username=username, full_name=full_name)
        SESSIONS[user_id] = session
    return session


def reset(user_id: int, username: str | None, full_name: str) -> Session:
    session = Session(user_id=user_id, username=username, full_name=full_name)
    SESSIONS[user_id] = session
    return session


def get(user_id: int) -> Session | None:
    return SESSIONS.get(user_id)
