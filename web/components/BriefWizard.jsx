"use client";

import { useEffect, useRef, useState } from "react";
import { QUESTIONS, SCOPE_CHOICES } from "../lib/questions";

const STEP_INTRO = "intro";
const STEP_QUESTIONS = "questions";
const STEP_DONE = "done";
const STEP_ERROR = "error";

function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const start = async () => {
    setBlob(null);
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
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const reset = () => {
    setBlob(null);
    chunksRef.current = [];
  };

  return { recording, blob, start, stop, reset };
}

function VoiceRecorder({ onRecorded }) {
  const { recording, blob, start, stop, reset } = useRecorder();
  const [error, setError] = useState(null);

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
      <button type="button" className={`btn ${recording ? "btn-recording" : "btn-secondary"}`} onClick={handleClick}>
        {recording ? "⏹ To'xtatish" : blob ? "🎤 Qayta yozish" : "🎤 Ovoz yozish"}
      </button>
      {blob && !recording && (
        <div className="voice-preview">
          <audio controls src={URL.createObjectURL(blob)} />
          <button type="button" className="btn-link" onClick={handleRerecord}>
            O'chirish
          </button>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
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
  const [submitting, setSubmitting] = useState(false);
  const [resultTz, setResultTz] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const question = QUESTIONS[index];
  const isLast = index === QUESTIONS.length - 1;

  useEffect(() => {
    const existing = answers[question?.key];
    setTextDraft(existing?.kind === "text" ? existing.text : "");
    setVoiceDraft(existing?.kind === "voice" ? existing.blob : null);
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
    const updated = { ...answers, [question.key]: { kind: "text", text: choice } };
    setAnswers(updated);
    setVoiceDraft(null);
    goNext(updated);
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
      <div className="card">
        <h1>Ozvlcorp — HR &amp; Moliya AI-agent brifi</h1>
        <p>
          Bizga bir necha savolga javob bering — matn yoki ovoz bilan. Shundan so'ng jamoamiz
          sizga mos AI-agent taklifini tayyorlaydi.
        </p>
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
    return (
      <div className="card">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
        <p className="progress-label">
          {index + 1} / {QUESTIONS.length}
        </p>
        <h2>{question.text}</h2>
        {question.hint && <p className="hint">{question.hint}</p>}

        {question.key === "scope" && (
          <div className="choice-chips">
            {SCOPE_CHOICES.map((choice) => (
              <button
                key={choice}
                type="button"
                className="chip"
                onClick={() => handleQuickChoice(choice)}
                disabled={submitting}
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
            {submitting ? "Yuborilmoqda..." : isLast ? "Yakunlash ✅" : "Keyingi →"}
          </button>
        </div>
      </div>
    );
  }

  if (step === STEP_DONE) {
    return (
      <div className="card">
        <h1>Rahmat! Brif tayyor 🎉</h1>
        <p>Ma'lumotlaringiz jamoamizga yuborildi. 24 soat ichida siz bilan bog'lanamiz.</p>
        <pre className="tz-output">{resultTz}</pre>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>Xatolik yuz berdi</h1>
      <p className="error-text">{errorMessage}</p>
      <button type="button" className="btn btn-primary" onClick={() => setStep(STEP_QUESTIONS)}>
        Qayta urinish
      </button>
    </div>
  );
}
