import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { QuickRoleSwitcher } from "@/components/layout/QuickRoleSwitcher";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ticket Platform Verzel",
  description: "Plataforma de Eventos e Ingressos",
};

import { getSession } from "@/lib/auth";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html
      lang="pt-BR"
      className={`${plusJakartaSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>
          <Navbar user={session} />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <QuickRoleSwitcher />
        </ToastProvider>
      </body>
    </html>
  );
}
