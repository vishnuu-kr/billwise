'use client';

import React from 'react';
import HistoryTracker from '@/components/HistoryTracker';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ChevronLeft } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4 space-y-4">
      <HistoryTracker />
    </div>
  );
}
