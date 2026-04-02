import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";
import { SettingsProvider } from "@/components/SettingsProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PsicoManager - Gestão Clínica",
  description: "Sistema premium de gestão para psicólogos clínicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SettingsProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </SettingsProvider>
      </body>
    </html>
  );
}
