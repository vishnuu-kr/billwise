import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "BILLWISE — Know your KSEB bill before it arrives",
  description: "The simplest electricity intelligence for Kerala households. Predict your next KSEB electricity bill, understand your tariff slabs, and avoid high cost bands without technical jargon.",
  applicationName: "BILLWISE",
  keywords: [
    "KSEB bill calculator",
    "KSEB bill prediction",
    "KSEB meter reading calculator",
    "Kerala electricity bill estimate",
    "KSEB tariff slabs",
    "LT-1A domestic",
    "KSEB bill check"
  ],
  authors: [{ name: "BILLWISE Kerala" }],
  creator: "BILLWISE",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "BILLWISE — Know your KSEB bill before it arrives",
    description: "Scan your previous bill, check your meter, and know your exact expected KSEB bill range in seconds.",
    url: "https://billwise.app",
    siteName: "BILLWISE",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BILLWISE — Know your KSEB bill before it arrives",
    description: "Instant KSEB bill prediction and slab alerts for Kerala homes.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col bg-[#fbfbfa] text-[#0f172a]">
        <LanguageProvider>
          <ServiceWorkerRegister />
          <Header />
          <main className="flex-1 w-full pb-20 md:pb-12">
            {children}
          </main>
          <BottomNav />
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
