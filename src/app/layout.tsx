import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Sinapsi Gestor - Gestão Clínica",
  description: "Sistema premium de gestão para psicólogos clínicos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sinapsi Gestor",
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
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
