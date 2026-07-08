import "./globals.css";

export const metadata = {
  title: "Ozvlcorp — AI-agent brifi",
  description: "HR va moliya AI-agentlar uchun ovozli/matnli brif-forma",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
