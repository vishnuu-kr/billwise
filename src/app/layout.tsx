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
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.domain),
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  applicationName: SITE_CONFIG.name,
  keywords: [
    "electricity bill calculator",
    "KSEB bill prediction",
    "BESCOM bill calculator",
    "MSEDCL bill estimate",
    "electricity tariff slabs",
    "Kerala electricity bill estimate",
    "India power tariff check",
    "LT-1A domestic"
  ],
  authors: [{ name: "BILLWISE" }],
  creator: SITE_CONFIG.name,
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  verification: {
    google: "g5sVzrvEHPfaEeStWNMiJX7-CpVEePH_VUt99wbdktM",
  },
  openGraph: {
    title: SITE_CONFIG.title,
    description: "Scan your previous bill, check your meter, and know your exact expected electricity bill range across 25+ Indian boards.",
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_CONFIG.name,
  url: SITE_CONFIG.domain,
  description: SITE_CONFIG.description,
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${poppins.variable} font-sans min-h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="google-site-verification" content="g5sVzrvEHPfaEeStWNMiJX7-CpVEePH_VUt99wbdktM" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col text-[#17171C] selection:bg-[#006FEE]/20">
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
