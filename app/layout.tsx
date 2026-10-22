import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "URL to Markdown",
  description: "웹 페이지 URL을 Markdown으로 바꿔 복사하거나 ChatGPT·Claude로 바로 넘깁니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
            <span className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-6 place-items-center rounded-md bg-primary font-mono text-[11px] text-primary-foreground">
                .md
              </span>
              URL to Markdown
            </span>
            <ThemeToggle />
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-16">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
