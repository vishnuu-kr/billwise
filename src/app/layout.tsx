import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { SITE_CONFIG } from "@/lib/config/site";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#F7F7F5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.domain),
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  applicationName: SITE_CONFIG.name,
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
  creator: SITE_CONFIG.name,
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: SITE_CONFIG.title,
    description: "Scan your previous bill, check your meter, and know your exact expected KSEB bill range in seconds.",
    url: SITE_CONFIG.domain,
    siteName: SITE_CONFIG.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.title,
    description: "Instant KSEB bill prediction and slab alerts for Kerala homes.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${poppins.variable} font-sans h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  for (var i = 0; i < regs.length; i++) { regs[i].unregister(); }
                });
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    for (var i = 0; i < keys.length; i++) { caches.delete(keys[i]); }
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F7F7F5] text-[#17171C] selection:bg-[#006FEE]/20">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#006FEE] focus:text-white focus:font-semibold focus:rounded-xl focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-white"
        >
          Skip to content
        </a>
        <LanguageProvider>
          <ServiceWorkerRegister />
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1 w-full pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-12 focus:outline-none">
            {children}
          </main>
          <BottomNav />
          {/* Footer is only rendered on desktop to preserve 100% native mobile app feel */}
          <div className="hidden md:block">
            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
