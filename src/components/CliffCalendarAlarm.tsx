'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Calendar, Bell, Check, ShieldAlert, Sparkles, ExternalLink, Download } from 'lucide-react';
import { analytics } from '@/lib/observability/analytics';

interface CliffCalendarAlarmProps {
  cycleStartDate?: Date;
  onAlarmSet?: () => void;
  compact?: boolean;
}

export default function CliffCalendarAlarm({
  cycleStartDate,
  onAlarmSet,
  compact = false,
}: CliffCalendarAlarmProps) {
  const { lang } = useLanguage();
  const [isCalendarAdded, setIsCalendarAdded] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  // Day 42 calculation
  const baseDate = cycleStartDate || new Date();
  const alertDate = new Date(baseDate.getTime() + 42 * 86400000);
  
  // Format for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const eventTitle = lang === 'ml'
    ? '⚡ KSEB 42-ാം ദിവസത്തെ ക്ലിഫ് പരിശോധന (സബ്സിഡി സംരക്ഷിക്കാം)'
    : '⚡ KSEB Day 42 Cliff Check: Save your electricity subsidy';

  const eventDescription = lang === 'ml'
    ? 'നിങ്ങളുടെ മീറ്റർ റീഡിംഗ് പരിശോധിച്ച് 240 യൂണിറ്റ് സബ്സിഡി പരിധി കടക്കാതെ കാക്കുക. സന്ദർശിക്കുക: https://billwise.app'
    : 'Check your electricity meter today to make sure you stay below the 240-unit subsidy cliff and save over ₹400. Visit https://billwise.app';

  // 1. Generate downloadable .ics file
  const handleDownloadIcs = () => {
    const startDateFormatted = formatGoogleDate(alertDate);
    const endDateFormatted = formatGoogleDate(new Date(alertDate.getTime() + 3600000)); // 1 hour event

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Billwise//KSEB Cliff Defense//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:${eventTitle}`,
      `DESCRIPTION:${eventDescription}`,
      `DTSTART:${startDateFormatted}`,
      `DTEND:${endDateFormatted}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT0M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${eventTitle}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'kseb-day42-cliff-check.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsCalendarAdded(true);
    analytics.track('cliff_alarm_calendar_downloaded', { alertDate: alertDate.toISOString() });
    if (onAlarmSet) onAlarmSet();
  };

  // 2. Open Google Calendar link
  const handleOpenGoogleCalendar = () => {
    const startStr = formatGoogleDate(alertDate);
    const endStr = formatGoogleDate(new Date(alertDate.getTime() + 3600000));
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      eventTitle
    )}&dates=${startStr}/${endStr}&details=${encodeURIComponent(
      eventDescription
    )}&location=Home+Meter`;

    window.open(url, '_blank', 'noopener,noreferrer');
    setIsCalendarAdded(true);
    analytics.track('cliff_alarm_google_calendar_opened', { alertDate: alertDate.toISOString() });
    if (onAlarmSet) onAlarmSet();
  };

  // 3. Request Web Push Notification Permission
  const handleRequestPush = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setPushStatus('granted');
          new Notification(
            lang === 'ml' ? '⚡ ക്ലിഫ് അലർട്ട് സജ്ജീകരിച്ചു!' : '⚡ Cliff Alert Activated!',
            {
              body: lang === 'ml'
                ? 'നിങ്ങളുടെ സൈക്കിളിന്റെ 42-ാം ദിവസം ഞങ്ങൾ ഓർമ്മിപ്പിക്കും.'
                : "We'll remind you on Day 42 before you cross the 240-unit subsidy cliff.",
              icon: '/icons/icon-192x192.png',
            }
          );
          analytics.track('cliff_push_granted', {});
          if (onAlarmSet) onAlarmSet();
        } else {
          setPushStatus('denied');
        }
      } catch (e) {
        console.error('Notification permission error', e);
        setPushStatus('denied');
      }
    }
  };

  const formattedDateString = alertDate.toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-IN', {
    month: 'short',
    day: 'numeric',
  });

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleOpenGoogleCalendar}
          className="ios-btn-primary px-3 py-2 text-[12px] font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{lang === 'ml' ? `Day 42 അലർട്ട് (${formattedDateString})` : `Set Day 42 Alarm (${formattedDateString})`}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-[#006FEE]/20 p-4 space-y-3.5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#006FEE]/10 flex items-center justify-center text-[#006FEE] shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-[#17171C]">
              {lang === 'ml' ? '42-ാം ദിവസത്തെ ക്ലിഫ് അലർട്ട്' : 'Day 42 Cliff Defense Alarm'}
            </span>
            <span className="text-[10px] font-semibold bg-[#17C964]/10 text-[#0E7036] px-2 py-0.5 rounded-full">
              Zero Login
            </span>
          </div>
          <p className="text-[12px] text-[#71717A] leading-relaxed">
            {lang === 'ml'
              ? `നിങ്ങൾ മീറ്റർ എന്നും നോക്കേണ്ടതില്ല. 42-ാം ദിവസം (${formattedDateString}) കൃത്യമായി ഓർമ്മിപ്പിക്കാം.`
              : `Don't babysit your meter. We'll sound the alarm on Day 42 (${formattedDateString}) to keep your subsidy safe.`}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleOpenGoogleCalendar}
          className={`py-2.5 px-3 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isCalendarAdded
              ? 'bg-[#17C964]/10 text-[#0E7036] border border-[#17C964]/30'
              : 'bg-[#006FEE] text-white hover:bg-[#005bc4] shadow-xs active:scale-[0.98]'
          }`}
        >
          {isCalendarAdded ? <Check className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
          <span>
            {isCalendarAdded
              ? lang === 'ml' ? 'കലണ്ടറിൽ ചേർത്തു' : 'Alarm Added'
              : lang === 'ml' ? 'Google Calendar' : 'Google Calendar'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleDownloadIcs}
          className="py-2.5 px-3 rounded-xl text-[12px] font-medium bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#17171C] flex items-center justify-center gap-1.5 border border-black/[0.05] transition-all cursor-pointer active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5 text-[#71717A]" />
          <span>{lang === 'ml' ? 'Apple / Phone (.ics)' : 'Apple / Phone (.ics)'}</span>
        </button>
      </div>

      {/* Browser Web Push Toggle (Optional) */}
      <div className="pt-2 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-[#71717A]">
        <div className="flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-[#006FEE]" />
          <span>{lang === 'ml' ? 'ബ്രൗസർ പുഷ് നോട്ടിഫിക്കേഷൻ' : 'Browser push notification'}</span>
        </div>

        {pushStatus === 'granted' ? (
          <span className="text-[#0E7036] font-semibold flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>{lang === 'ml' ? 'സജ്ജം' : 'Active'}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleRequestPush}
            className="text-[#006FEE] font-semibold hover:underline cursor-pointer"
          >
            {lang === 'ml' ? 'ഓൺ ചെയ്യുക' : 'Enable'}
          </button>
        )}
      </div>
    </div>
  );
}
