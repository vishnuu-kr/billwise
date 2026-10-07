'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { TabBar, type TabBarItem } from '@/components/ui/TabBar';
import { haptics } from '@/lib/haptics';
import {
  Camera,
  SlidersHorizontal,
  Wallet,
  Tv,
  BookOpen,
  Receipt,
  FileQuestion,
  Settings,
  ShieldCheck,
  Info,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('sheet=more')) {
      setIsMoreOpen(true);
    } else {
      setIsMoreOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isMoreOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMoreOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen]);

  useEffect(() => {
    if (isMoreOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMoreOpen]);

  const currentTab = isMoreOpen
    ? 'more'
    : pathname === '/'
    ? 'home'
    : (pathname === '/predict' || pathname === '/result' || pathname === '/manual')
    ? 'predict'
    : pathname === '/history'
    ? 'history'
    : 'more';

  const router = useRouter();

  useEffect(() => {
    router.prefetch('/');
    router.prefetch('/predict');
    router.prefetch('/history');
    router.prefetch('/scan');
  }, [router]);

  const handleTabChange = (id: string) => {
    haptics.selection();
    if (id === 'home') {
      setIsMoreOpen(false);
      router.push('/');
    } else if (id === 'predict') {
      setIsMoreOpen(false);
      router.push('/predict');
    } else if (id === 'history') {
      setIsMoreOpen(false);
      router.push('/history');
    } else if (id === 'more') {
      setIsMoreOpen((prev) => !prev);
    }
  };

  const dockItems: TabBarItem[] = [
    {
      id: 'home',
      label: lang === 'ml' ? 'ഹോം' : 'Home',
      icon: (
        <path d="M4 10.25 12 4l8 6.25V19a1 1 0 0 1-1 1h-4.5v-5.25h-5V20H5a1 1 0 0 1-1-1Z" />
      ),
    },
    {
      id: 'predict',
      label: lang === 'ml' ? 'മീറ്റർ' : 'Meter',
      icon: (
        <path d="M13 2 4.5 13.5h6L9.5 22l9.5-11.5h-6L13 2Z" />
      ),
    },
    {
      id: 'history',
      label: lang === 'ml' ? 'ചരിത്രം' : 'History',
      icon: (
        <>
          <rect x="4.5" y="13" width="3" height="7" rx="1" />
          <rect x="10.5" y="5" width="3" height="15" rx="1" />
          <rect x="16.5" y="9" width="3" height="11" rx="1" />
        </>
      ),
    },
    {
      id: 'more',
      label: lang === 'ml' ? 'കൂടുതൽ' : 'More',
      icon: (
        <>
          <rect x="4.5" y="4.5" width="6" height="6" rx="1.5" />
          <rect x="13.5" y="4.5" width="6" height="6" rx="1.5" />
          <rect x="4.5" y="13.5" width="6" height="6" rx="1.5" />
          <rect x="13.5" y="13.5" width="6" height="6" rx="1.5" />
        </>
      ),
    },
  ];

  // Grouped Tools for More sheet (reduced to 3 clear, focused categories)
  const primaryTools = [
    {
      href: '/scan',
      icon: Camera,
      title: lang === 'ml' ? 'ബിൽ സ്കാൻ ചെയ്യാം' : 'Scan printed bill',
      sub: lang === 'ml' ? 'കഴിഞ്ഞ ബില്ലിൽ നിന്നുള്ള റീഡിംഗ്' : 'Read previous bill values instantly',
    },
    {
      href: '/what-if',
      icon: SlidersHorizontal,
      title: lang === 'ml' ? 'What-If സിമുലേറ്റർ' : 'What-if simulator',
      sub: lang === 'ml' ? 'ഉപയോഗ മാറ്റങ്ങൾ മുൻകൂട്ടി കാണുക' : 'Preview impact of usage shifts',
    },
    {
      href: '/budget',
      icon: Wallet,
      title: lang === 'ml' ? 'ബിൽ പരിധി നിശ്ചയിക്കാം' : 'Keep bill under budget',
      sub: lang === 'ml' ? 'തുക ഇതിൽ താഴെ നിർത്താം' : 'Find your unit headroom ceiling',
    },
    {
      href: '/appliances',
      icon: Tv,
      title: lang === 'ml' ? 'ഉപകരണങ്ങളുടെ ചെലവ്' : 'Appliance audit',
      sub: lang === 'ml' ? 'കൂടുതൽ കറണ്ട് എടുക്കുന്നവ' : 'Estimate device power shares',
    },
  ];

  const knowledgeGroup = [
    {
      href: '/how-it-works',
      icon: BookOpen,
      title: lang === 'ml' ? 'ബില്ലിംഗ് എങ്ങനെ പ്രവർത്തിക്കുന്നു' : 'How KSEB billing works',
      sub: lang === 'ml' ? 'ടെലിസ്കോപ്പിക് സ്ലാബ് രീതി' : 'Telescopic slab mechanics explained',
    },
    {
      href: '/tariff',
      icon: Receipt,
      title: lang === 'ml' ? 'താരിഫ് നിരക്കുകൾ (LT-1A)' : 'Tariff rates (LT-1A)',
      sub: lang === 'ml' ? 'ഔദ്യോഗിക KSERC നിരക്കുകൾ' : 'Official domestic slabs & fixed charges',
    },
    {
      href: '/explain',
      icon: FileQuestion,
      title: lang === 'ml' ? 'തുക എങ്ങോട്ടാണ് പോകുന്നത്' : 'Where your money goes',
      sub: lang === 'ml' ? 'ചാർജ്ജ്, ഡ്യൂട്ടി, FAC വിഭജനം' : 'Itemized rupee breakdown & duty',
    },
  ];

  const appGroup = [
    {
      href: '/?mode=setup',
      icon: Sparkles,
      title: lang === 'ml' ? 'വീട് വീണ്ടും സജ്ജീകരിക്കാം' : 'Reconfigure home profile',
      sub: lang === 'ml' ? 'താരിഫും ബോർഡും മാറ്റുക' : 'Change provider or reset baseline',
    },
    {
      href: '/settings',
      icon: Settings,
      title: lang === 'ml' ? 'സെറ്റിംഗ്സ് & ഡാറ്റ' : 'Settings & local data',
      sub: lang === 'ml' ? 'ബാക്കപ്പ് അല്ലെങ്കിൽ മായ്ക്കുക' : 'Export, backup, or erase device data',
    },
    {
      href: '/privacy',
      icon: ShieldCheck,
      title: lang === 'ml' ? 'സ്വകാര്യതാ ഉറപ്പ്' : 'Privacy guarantee',
      sub: lang === 'ml' ? '100% നിങ്ങളുടെ ഫോണിൽ മാത്രം' : 'Zero login, zero telemetry tracking',
    },
    {
      href: '/about',
      icon: Info,
      title: lang === 'ml' ? 'BILLWISE വിവരണം' : 'About BILLWISE',
      sub: lang === 'ml' ? 'കേരള ഗാർഹിക ഉപഭോക്താക്കൾക്കായി' : 'Independent utility for Kerala homes',
    },
  ];

  return (
    <>
      {/* -- Dock / Menu Bar (Mobile Only) ----------------- */}
      <nav
        aria-label="App Navigation"
        className="fixed bottom-0 inset-x-0 z-40 flex justify-center pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-1 px-3 pointer-events-none select-none transition-transform md:hidden"
      >
        <div className="pointer-events-auto w-full max-w-[420px] rounded-[32px] bg-white/88 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] ring-1 ring-black/[0.05] px-2 py-1">
          <TabBar
            idBase="billwise-dock"
            label="App Navigation"
            items={dockItems}
            value={currentTab}
            onChange={handleTabChange}
          />
        </div>
      </nav>

      {/* -- Native iOS-Style Bottom Sheet for More Menu ----- */}
      <AnimatePresence>
        {isMoreOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={lang === 'ml' ? 'കൂടുതൽ ടൂളുകൾ' : 'Tools & Utilities'}
            className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.42)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {/* Backdrop Dismiss */}
            <div
              className="absolute inset-0 -z-10"
              onClick={() => setIsMoreOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setIsMoreOpen(false);
                }
              }}
              className="ios-sheet w-full max-h-[85vh] md:max-h-[80vh] md:max-w-[460px] md:rounded-[28px] md:shadow-2xl overflow-y-auto"
              style={{
                padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 24px)',
              }}
            >
              {/* Grab Handle */}
              <div className="flex justify-center pt-1 pb-3 md:hidden">
                <div className="ios-sheet-handle cursor-grab active:cursor-grabbing" />
              </div>

              {/* Title & Close */}
              <div className="flex items-center justify-between px-2 mb-3.5">
                <h2 className="text-[19px] font-semibold tracking-tight text-[#17171C]">
                  {lang === 'ml' ? 'കൂടുതൽ ടൂളുകൾ' : 'Tools & Utilities'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-[#71717A] hover:text-[#17171C] active:scale-[0.96] transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] rounded-full"
                  aria-label="Close tools menu"
                >
                  <span className="w-7 h-7 rounded-full bg-black/[0.06] flex items-center justify-center">
                    <X className="w-4 h-4" aria-hidden="true" />
                  </span>
                </button>
              </div>

              <div className="space-y-4">
                {/* GROUP 1: PRIMARY TOOLS */}
                <div>
                  <span className="text-[11px] font-semibold text-[#71717A] block px-2 mb-1.5 uppercase tracking-wider">
                    {lang === 'ml' ? 'പ്രധാന ടൂളുകൾ' : 'Primary Tools'}
                  </span>
                  <div className="ios-grouped-list">
                    {primaryTools.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMoreOpen(false)}
                        className="ios-row text-inherit no-underline"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#006FEE]/10 flex items-center justify-center text-[#006FEE]">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-[#17171C] leading-tight">{item.title}</p>
                            <p className="text-[12px] text-[#71717A] leading-tight mt-0.5">{item.sub}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* GROUP 2: KNOWLEDGE & TARIFFS */}
                <div>
                  <span className="text-[11px] font-semibold text-[#71717A] block px-2 mb-1.5 uppercase tracking-wider">
                    {lang === 'ml' ? 'വിവരങ്ങൾ' : 'Knowledge & Tariff'}
                  </span>
                  <div className="ios-grouped-list">
                    {knowledgeGroup.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMoreOpen(false)}
                        className="ios-row text-inherit no-underline"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-black/[0.04] flex items-center justify-center text-[#17171C]">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-[#17171C] leading-tight">{item.title}</p>
                            <p className="text-[12px] text-[#71717A] leading-tight mt-0.5">{item.sub}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* GROUP 3: APP & PRIVACY */}
                <div>
                  <span className="text-[11px] font-semibold text-[#71717A] block px-2 mb-1.5 uppercase tracking-wider">
                    {lang === 'ml' ? 'ആപ്പ് വിവരങ്ങൾ' : 'App & Preferences'}
                  </span>
                  <div className="ios-grouped-list">
                    {appGroup.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMoreOpen(false)}
                        className="ios-row text-inherit no-underline"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-black/[0.04] flex items-center justify-center text-[#17171C]">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-[#17171C] leading-tight">{item.title}</p>
                            <p className="text-[12px] text-[#71717A] leading-tight mt-0.5">{item.sub}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
