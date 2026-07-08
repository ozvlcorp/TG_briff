// OY logotipi — SVG (o'lchamga moslashadi, currentColor rangini oladi).
// Chapda to'ldirilgan doira (O), o'ngda kamerton/"Y" shakli (Y).
export default function Logo({ size = 44, className = "" }) {
  const width = (size * 116) / 56;
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 116 56"
      className={className}
      role="img"
      aria-label="OY logotipi"
      fill="none"
    >
      <circle cx="26" cy="28" r="22" fill="currentColor" />
      <g
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* chap va o'ng shoxlar + pastda yumaloq birlashma (kamerton) */}
        <path d="M70 8 V22 a15 15 0 0 0 30 0 V8" />
        {/* pastga ketuvchi oyoq */}
        <path d="M85 37 V50" />
      </g>
    </svg>
  );
}
