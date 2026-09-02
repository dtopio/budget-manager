import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/theme-provider";
import { buildThemeCss, DEFAULT_THEME } from "@/lib/themes";
import "./globals.css";

const sans = Instrument_Sans({
  variable: "--font-sans-face",
  subsets: ["latin"],
});

// Titles only. A display serif against the grotesque is what stops a dashboard of
// rounded rectangles from reading as a template.
const serif = Instrument_Serif({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Budget Manager",
  description: "Track income, expenses, and budgets by category.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${geistMono.variable} h-full antialiased`}
      data-palette={DEFAULT_THEME}
      suppressHydrationWarning
    >
      <head>
        {/* Every theme's custom properties, generated from the hex seeds in
            src/lib/themes.ts. Switching is then just an attribute flip on <html>. */}
        <style dangerouslySetInnerHTML={{ __html: buildThemeCss() }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
