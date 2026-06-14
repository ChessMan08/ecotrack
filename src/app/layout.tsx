import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: {
    default: "Ecotrack — Carbon Footprint Awareness Platform",
    template: "%s | Ecotrack",
  },
  description:
    "Track, understand, and reduce your personal carbon footprint. Get personalized insights powered by Google Gemini AI.",
  keywords: ["carbon footprint", "climate", "sustainability", "CO2", "emissions tracker"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('theme')||'system';const d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t==='system'&&d))document.documentElement.classList.add('dark');}catch{}`,
          }}
        />
      </head>
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
