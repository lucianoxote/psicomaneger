import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";
import { SettingsProvider } from "@/components/SettingsProvider";
import AuthProvider from "@/components/AuthProvider";

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
  title: "Sinapsi Gestor - Gestão Clínica",
  description: "Sistema premium de gestão para psicólogos clínicos",
  icons: {
    icon: '/favicon-sinapsi.png?v=4',
    apple: '/favicon-sinapsi.png?v=4',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <SettingsProvider>
            <DashboardLayout>
              {children}
            </DashboardLayout>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
