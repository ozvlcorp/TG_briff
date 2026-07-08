// Brauzer ovozini (webm/opus va h.k.) mp3 ga o'giradi, toki Telegram uni
// o'ynatiladigan audio (sendAudio) sifatida qabul qilsin. Faqat mijoz ovoz
// yuborgan holatda, brauzerда ishlaydi.
export async function blobToMp3(blob) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) throw new Error("Web Audio API mavjud emas");

  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new AudioCtx();
  let audioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    if (ctx.close) ctx.close();
  }

  const { Mp3Encoder } = await import("@breezystack/lamejs");

  const sampleRate = audioBuffer.sampleRate;
  const kbps = 64; // ovoz uchun yetarli, hajmi kichik
  const encoder = new Mp3Encoder(1, sampleRate, kbps); // mono

  const length = audioBuffer.length;
  const ch0 = audioBuffer.getChannelData(0);
  const ch1 = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;

  // Float32 [-1,1] -> mono Int16 PCM
  const samples = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    let s = ch1 ? (ch0[i] + ch1[i]) / 2 : ch0[i];
    s = Math.max(-1, Math.min(1, s));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const blockSize = 1152;
  const chunks = [];
  for (let i = 0; i < samples.length; i += blockSize) {
    const slice = samples.subarray(i, i + blockSize);
    const buf = encoder.encodeBuffer(slice);
    if (buf.length > 0) chunks.push(new Uint8Array(buf));
  }
  const end = encoder.flush();
  if (end.length > 0) chunks.push(new Uint8Array(end));

  return new Blob(chunks, { type: "audio/mpeg" });
}
