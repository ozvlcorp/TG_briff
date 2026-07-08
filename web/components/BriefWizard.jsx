"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS, SCOPE_CHOICES } from "../lib/questions";
import { COMPANY, companyContacts } from "../lib/company";
import Logo from "./Logo";

// PDF rasterlashда emoji "tofu" bo'lmasligi uchun ularni olib tashlaymiz
// (matn — kirill/lotin — o'zi to'g'ri chiqadi).
function stripEmoji(text) {
  return (text || "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/^[ \t]+/gm, (m) => m); // tekislashni saqlaymiz
}

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
  const [pdfBusy, setPdfBusy] = useState(false);
  const printRef = useRef(null);

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

  // Haqiqiy bir bosishli PDF yuklab olish. Brend hujjatini (.print-doc)
  // html2canvas bilan rasmga olamiz va jsPDF bilan A4 PDF qilamiz — chop
  // etish oynasi kerak emas, UZ/RU/kirill matnlar to'g'ri chiqadi.
  // Kutubxonalar faqat bosilganda yuklanadi (lazy import).
  const handleDownloadPdf = async () => {
    const el = printRef.current;
    if (!el || pdfBusy) return;
    setPdfBusy(true);
    const safeName = (clientName || "mijoz").trim().replace(/\s+/g, "-").replace(/[^\w\-.]/g, "") || "mijoz";
    try {
      const [{ jsPDF }, html2canvasMod] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const html2canvas = html2canvasMod.default || html2canvasMod;

      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: el.scrollWidth,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      // JPEG — oq fondagi matn uchun hajm keskin kichik, sifat yetarli
      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
        heightLeft -= pageH;
      }
      pdf.save(`${COMPANY.name}-brief-${safeName}.pdf`);
    } catch (err) {
      console.error("PDF yaratishда xatolik, chop etishga o'tamiz:", err);
      // Zaxira yo'l: brauzer chop etish oynasi (Saqlash → PDF)
      try {
        window.print();
      } catch {
        /* ignore */
      }
    } finally {
      setPdfBusy(false);
    }
  };

  const submitBrief = async (finalAnswers) => {
    setSubmitting(true);
    setErrorMessage("");
    try {
      const formData = new FormData();
      formData.append("client_name", clientName);
      formData.append("client_contact", clientContact);

      // Ovoz javoblarini yuborishдан oldin mp3 ga o'giramiz (Telegram'да
      // o'ynatiladigan audio bo'lishi uchun). Konverter faqat kerak bo'lganда
      // yuklanadi; xato bo'lsa asl webm yuboriladi (zaxira).
      let toMp3 = null;
      const hasVoice = QUESTIONS.some((q) => finalAnswers[q.key]?.kind === "voice" && finalAnswers[q.key]?.blob);
      if (hasVoice) {
        try {
          ({ blobToMp3: toMp3 } = await import("../lib/audio"));
        } catch {
          toMp3 = null;
        }
      }

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
          let out = a.blob;
          let filename = `${q.key}.webm`;
          if (toMp3) {
            try {
              out = await toMp3(a.blob);
              filename = `${q.key}.mp3`;
            } catch (convErr) {
              console.error("Ovozni mp3 ga o'girib bo'lmadi, webm yuboriladi:", convErr);
            }
          }
          formData.append(`${q.key}__voice`, out, filename);
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
            <button type="button" className="btn btn-primary" onClick={handleDownloadPdf} disabled={pdfBusy}>
              {pdfBusy ? (
                <span className="btn-spinner-wrap">
                  <span className="spinner" /> Tayyorlanmoqda...
                </span>
              ) : (
                "📄 PDF yuklab olish"
              )}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleCopyTz}>
              {copied ? "✅ Nusxalandi" : "📋 Matnni nusxalash"}
            </button>
          </div>
          <pre className="tz-output">{resultTz}</pre>
        </div>
        <PrintDoc ref={printRef} tz={resultTz} clientName={clientName} clientContact={clientContact} />
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

const PrintDoc = forwardRef(function PrintDoc({ tz, clientName, clientContact }, ref) {
  const contacts = companyContacts();
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const today = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  return (
    <div className="print-doc" ref={ref} aria-hidden="true">
      <header className="print-head">
        <div className="print-brand">
          <Logo size={44} />
          <div>
            <div className="print-company">{COMPANY.fullName}</div>
            <div className="print-tagline">{COMPANY.tagline}</div>
          </div>
        </div>
        <div className="print-date">{today}</div>
      </header>

      <div className="print-client">
        {clientName ? <div><strong>Mijoz:</strong> {clientName}</div> : null}
        {clientContact ? <div><strong>Kontakt:</strong> {clientContact}</div> : null}
      </div>

      <pre className="print-tz">{stripEmoji(tz)}</pre>

      <footer className="print-foot">
        {contacts.length > 0 && (
          <>
            <div className="print-foot-title">{COMPANY.name} bilan bog'lanish</div>
            <div className="print-foot-contacts">
              {contacts.map((c) => (
                <span key={c.label}>
                  <strong>{c.label}:</strong> {c.value}
                </span>
              ))}
            </div>
          </>
        )}
        <div className="print-foot-note">
          {COMPANY.fullName} · Ushbu hujjat {COMPANY.name} brif tizimi orqali tayyorlandi.
        </div>
      </footer>
    </div>
  );
});
