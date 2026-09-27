'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import { analytics } from '@/lib/observability/analytics';
import { UserFeedbackCategory } from '@/types';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function PublicFeedbackPage() {
  const { lang } = useLanguage();
  const [topic, setTopic] = useState<'prediction' | 'scanner' | 'calculator' | 'language' | 'other'>('prediction');
  const [sentiment, setSentiment] = useState<'positive' | 'negative'>('positive');
  const [category, setCategory] = useState<UserFeedbackCategory>('other');
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      storageManager.saveFeedback({
        context: topic === 'prediction' ? 'prediction_result' : topic === 'scanner' ? 'scanner' : 'general',
        sentiment,
        category,
        comment: comment.trim() || undefined,
      });

      analytics.track('feedback_submitted', {
        topic,
        sentiment,
        category,
      });

      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 pt-12 sm:pt-20 text-center space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 mx-auto shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {lang === 'ml' ? 'നന്ദി! അഭിപ്രായം ലഭിച്ചു' : 'Thank you for your feedback!'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {lang === 'ml'
              ? 'നിങ്ങളുടെ പ്രതികരണം ബിൽവൈസ് കൂടുതൽ കൃത്യമാക്കാൻ സഹായിക്കും. യാതൊരു സ്വകാര്യ വിവരങ്ങളും ശേഖരിച്ചിട്ടില്ല.'
              : 'Your feedback directly helps calibrate and refine BILLWISE for all Kerala households. No personal identifiers were recorded.'}
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/predict"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 py-3.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
          >
            <span>{lang === 'ml' ? 'ബിൽ പരിശോധിക്കാം' : 'Calculate Next Bill'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            onClick={() => {
              setIsSubmitted(false);
              setComment('');
            }}
            className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {lang === 'ml' ? 'മറ്റൊരു അഭിപ്രായം' : 'Submit another note'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-800">
          <MessageSquare className="h-3.5 w-3.5 text-sky-600" />
          <span>{lang === 'ml' ? 'പൊതുജന അഭിപ്രായം' : 'Community Feedback'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
          {lang === 'ml' ? 'ബിൽവൈസ് മെച്ചപ്പെടുത്താൻ സഹായിക്കൂ' : 'Help us improve BILLWISE'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
          {lang === 'ml'
            ? 'ലോഗിൻ ആവശ്യമില്ല. നിങ്ങളുടെ അനുഭവം അല്ലെങ്കിൽ തെറ്റുകൾ ഇവിടെ പങ്കുവെക്കാം.'
            : 'Tell us about your experience or report discrepancies. No account or email needed.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        {/* Step 1: Feature Area */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            {lang === 'ml' ? 'ഏത് ഫീച്ചറിനെക്കുറിച്ചാണ്?' : 'Which feature is this about?'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { id: 'prediction', label: lang === 'ml' ? 'പ്രവചനം' : 'Prediction' },
              { id: 'scanner', label: lang === 'ml' ? 'സ്കാനർ' : 'Scanner' },
              { id: 'calculator', label: lang === 'ml' ? 'കാൽക്കുലേറ്റർ' : 'Calculator' },
              { id: 'language', label: lang === 'ml' ? 'ഭാഷ/മലയാളം' : 'Language' },
              { id: 'other', label: lang === 'ml' ? 'മറ്റുള്ളവ' : 'Something else' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTopic(item.id as any)}
                className={`rounded-xl p-3 text-left font-semibold border transition-all ${
                  topic === item.id
                    ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-2xs'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Sentiment */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            {lang === 'ml' ? 'നിങ്ങളുടെ അഭിപ്രായം എങ്ങനെയുള്ളതാണ്?' : 'How was your experience?'}
          </label>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setSentiment('positive')}
              className={`flex items-center justify-center gap-2 rounded-2xl p-3.5 font-bold border transition-all ${
                sentiment === 'positive'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                  : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ThumbsUp className="h-4 w-4 text-emerald-600" />
              <span>{lang === 'ml' ? 'നല്ല അനുഭവം / ഉപകാരം' : 'Helpful & Clear'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSentiment('negative')}
              className={`flex items-center justify-center gap-2 rounded-2xl p-3.5 font-bold border transition-all ${
                sentiment === 'negative'
                  ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-2xs'
                  : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ThumbsDown className="h-4 w-4 text-amber-600" />
              <span>{lang === 'ml' ? 'വ്യത്യാസം / പ്രശ്നം' : 'Issue / Inaccurate'}</span>
            </button>
          </div>
        </div>

        {/* Step 3: Specific category if negative */}
        {sentiment === 'negative' && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              {lang === 'ml' ? 'പ്രശ്നം എന്തായിരുന്നു?' : 'What went wrong?'}
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as UserFeedbackCategory)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-sky-500 focus:outline-none"
            >
              <option value="too_high">{lang === 'ml' ? 'ബിൽ തുക കൂടുതലായി തോന്നി' : 'Bill estimate seemed too high'}</option>
              <option value="too_low">{lang === 'ml' ? 'ബിൽ തുക കുറവായി തോന്നി' : 'Bill estimate seemed too low'}</option>
              <option value="explanation_unclear">{lang === 'ml' ? 'വിവരണം മനസ്സിലായില്ല' : 'Could not understand explanation'}</option>
              <option value="scanner_error">{lang === 'ml' ? 'സ്കാനർ റീഡിംഗ് തെറ്റായി വായിച്ചു' : 'Scanner failed or misread digits'}</option>
              <option value="other">{lang === 'ml' ? 'മറ്റ് പ്രശ്നങ്ങൾ' : 'Something else'}</option>
            </select>
          </div>
        )}

        {/* Step 4: Optional Comment */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <label className="font-bold uppercase tracking-wider text-slate-600">
              {lang === 'ml' ? 'കുറിപ്പ് (ഓപ്ഷണൽ)' : 'Tell us what happened (Optional)'}
            </label>
            <span className="font-mono text-[11px]">{comment.length}/400</span>
          </div>
          <textarea
            rows={3}
            maxLength={400}
            placeholder={
              lang === 'ml'
                ? 'ഉദാ: 220 യൂണിറ്റിന് ലഭിച്ച എസ്റ്റിമേറ്റ് യഥാർത്ഥ ബില്ലിനേക്കാൾ ₹50 കൂടുതലായിരുന്നു...'
                : 'e.g., My estimate for 220 units was ₹50 higher than my bill...'
            }
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white p-3.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{lang === 'ml' ? 'ദയവായി ഫോൺ നമ്പറോ കൺസ്യൂമർ നമ്പറോ നൽകരുത്.' : 'Do not include phone numbers or consumer IDs.'}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all touch-target disabled:opacity-50"
        >
          <span>{isSubmitting ? (lang === 'ml' ? 'അയക്കുന്നു...' : 'Submitting...') : (lang === 'ml' ? 'അഭിപ്രായം അയക്കുക' : 'Send Feedback')}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
