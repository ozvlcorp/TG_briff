"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS, SCOPE_CHOICES } from "../lib/questions";
import { COMPANY, companyContacts } from "../lib/company";
import Logo from "./Logo";

const STEP_INTRO = "intro";
const STEP_QUESTIONS = "questions";
const STEP_DONE = "done";
const STEP_ERROR = "error";

const CONFETTI_EMOJI = ["🎉", "✨", "🎊", "💫"];

function formatElapsed(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const start = async () => {
    setBlob(null);
    setElapsed(0);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || "audio/webm";
      setBlob(new Blob(chunksRef.current, { type }));
      streamRef.current?.getTracks().forEach((t) => t.stop());
      clearInterval(timerRef.current);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const reset = () => {
    setBlob(null);
    setElapsed(0);
    chunksRef.current = [];
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  return { recording, blob, elapsed, start, stop, reset };
}

function VoiceRecorder({ onRecorded }) {
  const { recording, blob, elapsed, start, stop, reset } = useRecorder();
  const [error, setError] = useState(null);

  const previewUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (blob) onRecorded(blob);
  }, [blob, onRecorded]);

  const handleClick = async () => {
    setError(null);
    try {
      if (recording) {
        stop();
      } else {
        await start();
      }
    } catch {
      setError("Mikrofonga ruxsat berilmadi. Brauzer sozlamalarini tekshiring.");
    }
  };

  const handleRerecord = () => {
    reset();
    onRecorded(null);
  };

  return (
    <div className="voice-recorder">
      <div className={`record-btn-wrap ${recording ? "recording" : ""}`}>
        <button type="button" className={`btn ${recording ? "btn-recording" : "btn-secondary"}`} onClick={handleClick}>
          {recording ? "⏹ To'xtatish" : blob ? "🎤 Qayta yozish" : "🎤 Ovoz yozish"}
        </button>
      </div>

      {recording && (
        <div className="recording-status">
          <span className="rec-dot" />
          <span>Yozilmoqda... {formatElapsed(elapsed)}</span>
          <span className="eq-bars">
            <span />
            <span />
            <span />
            <span />
          </span>
        </div>
      )}

      {blob && !recording && (
        <div className="voice-preview">
          <audio controls src={previewUrl} />
          <button type="button" className="btn-link" onClick={handleRerecord}>
            O'chirish
          </button>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.8 + Math.random() * 1,
        emoji: CONFETTI_EMOJI[i % CONFETTI_EMOJI.length],
      })),
    []
  );

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

function SuccessIcon() {
  return (
    <svg className="success-icon" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r="24" />
      <path d="M14 27l8 8 16-16" />
    </svg>
  );
}

export default function BriefWizard() {
  const [step, setStep] = useState(STEP_INTRO);
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textDraft, setTextDraft] = useState("");
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [selectedChip, setSelectedChip] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultTz, setResultTz] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const question = QUESTIONS[index];
  const isLast = index === QUESTIONS.length - 1;

  useEffect(() => {
    const existing = answers[question?.key];
    setTextDraft(existing?.kind === "text" ? existing.text : "");
    setVoiceDraft(existing?.kind === "voice" ? existing.blob : null);
    setSelectedChip(null);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitAnswer = (kind) => {
    const next = { ...answers };
    if (kind === "text") {
      next[question.key] = { kind: "text", text: textDraft };
    } else if (kind === "voice") {
      next[question.key] = { kind: "voice", blob: voiceDraft };
    } else {
      next[question.key] = { kind: "skipped" };
    }
    setAnswers(next);
    return next;
  };

  const goNext = (updatedAnswers) => {
    if (index < QUESTIONS.length - 1) {
      setIndex(index + 1);
    } else {
      submitBrief(updatedAnswers);
    }
  };

  const handleNext = () => {
    const kind = voiceDraft ? "voice" : textDraft.trim() ? "text" : "skipped";
    const updated = commitAnswer(kind);
    goNext(updated);
  };

  const handleSkip = () => {
    const updated = commitAnswer("skipped");
    goNext(updated);
  };

  const handleBack = () => {
    if (index > 0) setIndex(index - 1);
  };

  const handleFinishEarly = () => {
    const kind = voiceDraft ? "voice" : textDraft.trim() ? "text" : "skipped";
    const updated = commitAnswer(kind);
    submitBrief(updated);
  };

  const handleQuickChoice = (choice) => {
    setSelectedChip(choice);
    const updated = { ...answers, [question.key]: { kind: "text", text: choice } };
    setAnswers(updated);
    setVoiceDraft(null);
    setTimeout(() => goNext(updated), 220);
  };

  const handleCopyTz = async () => {
    try {
      await navigator.clipboard.writeText(resultTz);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable — matn baribir ekranda ko'rinib turibdi, qo'lda nusxalash mumkin.
    }
  };

  // PDF: brauzerning chop etish oynasi orqali ("Saqlash → PDF"). Bu yo'l
  // barcha harflar (UZ/RU/kirill) va emojini to'g'ri ko'rsatadi va tashqi
  // kutubxona talab qilmaydi. Chop etiladigan hujjat pastda .print-doc'da.
  const handleDownloadPdf = () => {
    const safeName = (clientName || "mijoz").trim().replace(/\s+/g, "-").replace(/[^\w\-.]/g, "");
    const prevTitle = document.title;
    document.title = `${COMPANY.name}-brief-${safeName}`;
    window.addEventListener("afterprint", () => {
      document.title = prevTitle;
    }, { once: true });
    window.print();
  };

  const submitBrief = async (finalAnswers) => {
    setSubmitting(true);
    setErrorMessage("");
    try {
      const formData = new FormData();
      formData.append("client_name", clientName);
      formData.append("client_contact", clientContact);

      for (const q of QUESTIONS) {
        const a = finalAnswers[q.key];
        if (!a) {
          formData.append(`${q.key}__kind`, "skipped");
          continue;
        }
        formData.append(`${q.key}__kind`, a.kind);
        if (a.kind === "text") {
          formData.append(`${q.key}__text`, a.text || "");
        } else if (a.kind === "voice" && a.blob) {
          formData.append(`${q.key}__voice`, a.blob, `${q.key}.webm`);
        }
      }

      const res = await fetch("/api/submit", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Noma'lum xatolik");

      setResultTz(data.tz || "");
      setStep(STEP_DONE);
    } catch (err) {
      setErrorMessage(err.message || "Yuborishda xatolik yuz berdi.");
      setStep(STEP_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === STEP_INTRO) {
    return (
      <div className="card intro-card">
        <div className="brand">
          <Logo size={40} className="brand-logo" />
          <div className="brand-text">
            <span className="brand-name">{COMPANY.name}</span>
            <span className="brand-tagline">{COMPANY.tagline}</span>
          </div>
        </div>
        <h1>HR &amp; Moliya AI-agent brifi</h1>
        <p>
          Bizga bir necha savolga javob bering — matn yoki ovoz bilan. Shundan so'ng jamoamiz
          sizga mos AI-agent taklifini tayyorlaydi.
        </p>
        <div className="feature-row">
          <span className="feature-pill">🎤 Ovoz bilan ham bo'ladi</span>
          <span className="feature-pill">⏱ ~5 daqiqa</span>
          <span className="feature-pill">🔒 Maxfiy</span>
        </div>
        <label className="field">
          <span>Ismingiz</span>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ism Familiya" />
        </label>
        <label className="field">
          <span>Telefon yoki Telegram username (ixtiyoriy)</span>
          <input value={clientContact} onChange={(e) => setClientContact(e.target.value)} placeholder="+998... yoki @username" />
        </label>
        <button type="button" className="btn btn-primary" onClick={() => setStep(STEP_QUESTIONS)}>
          Boshlash →
        </button>
      </div>
    );
  }

  if (step === STEP_QUESTIONS) {
    const percent = Math.round(((index + 1) / QUESTIONS.length) * 100);
    return (
      <div className="card">
        <div className="progress-track">
          {QUESTIONS.map((q, i) => (
            <div key={q.key} className={`progress-segment ${i <= index ? "filled" : ""}`} />
          ))}
        </div>
        <div className="progress-meta">
          <span>
            {index + 1} / {QUESTIONS.length}-savol
          </span>
          <span className="progress-percent">{percent}%</span>
        </div>

        <div key={question.key} className="question-block">
          <h2>{question.text}</h2>
          {question.hint && <p className="hint">{question.hint}</p>}

          {question.key === "scope" && (
            <div className="choice-chips">
              {SCOPE_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`chip ${selectedChip === choice ? "selected" : ""}`}
                  onClick={() => handleQuickChoice(choice)}
                  disabled={submitting || selectedChip !== null}
                >
                  {choice}
                </button>
              ))}
            </div>
          )}

          <textarea
            className="text-input"
            rows={4}
            placeholder="Javobingizni shu yerga yozing..."
            value={textDraft}
            onChange={(e) => {
              setTextDraft(e.target.value);
              if (e.target.value) setVoiceDraft(null);
            }}
            disabled={submitting}
          />

          <div className="or-divider">yoki</div>

          <VoiceRecorder
            onRecorded={(blob) => {
              setVoiceDraft(blob);
              if (blob) setTextDraft("");
            }}
          />
        </div>

        <div className="nav-buttons">
          <button type="button" className="btn-link" onClick={handleBack} disabled={index === 0 || submitting}>
            ⬅️ Orqaga
          </button>
          <button type="button" className="btn-link" onClick={handleSkip} disabled={submitting}>
            ⏭ O'tkazib yuborish
          </button>
          {!isLast && (
            <button type="button" className="btn-link" onClick={handleFinishEarly} disabled={submitting}>
              ✅ Yakunlash
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={handleNext} disabled={submitting}>
            {submitting ? (
              <span className="btn-spinner-wrap">
                <span className="spinner" /> Yuborilmoqda...
              </span>
            ) : isLast ? (
              "Yakunlash ✅"
            ) : (
              "Keyingi →"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (step === STEP_DONE) {
    return (
      <>
        <div className="card done-card app-shell">
          <ConfettiBurst />
          <div className="brand brand-center">
            <Logo size={34} className="brand-logo" />
            <span className="brand-name">{COMPANY.name}</span>
          </div>
          <SuccessIcon />
          <h1>Rahmat! Brif tayyor 🎉</h1>
          <p>Ma'lumotlaringiz {COMPANY.name} jamoasiga yuborildi. 24 soat ichida siz bilan bog'lanamiz.</p>
          <div className="success-actions">
            <button type="button" className="btn btn-primary" onClick={handleDownloadPdf}>
              📄 PDF yuklab olish
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleCopyTz}>
              {copied ? "✅ Nusxalandi" : "📋 Matnni nusxalash"}
            </button>
          </div>
          <pre className="tz-output">{resultTz}</pre>
        </div>
        <PrintDoc tz={resultTz} clientName={clientName} clientContact={clientContact} />
      </>
    );
  }

  return (
    <div className="card error-card app-shell">
      <div className="error-icon">⚠️</div>
      <h1>Xatolik yuz berdi</h1>
      <p className="error-text">{errorMessage}</p>
      <button type="button" className="btn btn-primary" onClick={() => setStep(STEP_QUESTIONS)}>
        Qayta urinish
      </button>
    </div>
  );
}

function PrintDoc({ tz, clientName, clientContact }) {
  const contacts = companyContacts();
  return (
    <div className="print-doc" aria-hidden="true">
      <header className="print-head">
        <div className="print-brand">
          <Logo size={44} />
          <div>
            <div className="print-company">{COMPANY.fullName}</div>
            <div className="print-tagline">{COMPANY.tagline}</div>
          </div>
        </div>
      </header>

      <div className="print-client">
        {clientName ? <div><strong>Mijoz:</strong> {clientName}</div> : null}
        {clientContact ? <div><strong>Kontakt:</strong> {clientContact}</div> : null}
      </div>

      <pre className="print-tz">{tz}</pre>

      {contacts.length > 0 && (
        <footer className="print-foot">
          <div className="print-foot-title">{COMPANY.name} bilan bog'lanish</div>
          <div className="print-foot-contacts">
            {contacts.map((c) => (
              <span key={c.label}>
                <strong>{c.label}:</strong> {c.value}
              </span>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
