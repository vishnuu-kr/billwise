'use client';

import React, { useState } from 'react';
import { storageManager } from '@/lib/storage';
import { analytics } from '@/lib/observability/analytics';
import { UserFeedbackCategory } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ThumbsUp, ThumbsDown, CheckCircle2, MessageSquare, ShieldAlert } from 'lucide-react';

interface FeedbackWidgetProps {
  context?: 'prediction_result' | 'scanner' | 'general';
  units?: number;
  predictedBill?: number;
}

export default function FeedbackWidget({
  context = 'prediction_result',
  units,
  predictedBill,
}: FeedbackWidgetProps) {
  const { lang } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [sentiment, setSentiment] = useState<'positive' | 'negative' | null>(null);
  const [category, setCategory] = useState<UserFeedbackCategory>('other');
  const [comment, setComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);

  const handleVote = (selectedSentiment: 'positive' | 'negative') => {
    setSentiment(selectedSentiment);
    if (selectedSentiment === 'positive') {
      // Direct fast submission for positive vote
      storageManager.saveFeedback({
        context,
        sentiment: 'positive',
        units,
        predictedBill,
      });
      analytics.track('feedback_submitted', { sentiment: 'positive', context });
      setSubmitted(true);
    } else {
      // Open category/comment for negative feedback so user can explain
      setShowCommentBox(true);
    }
  };

  const handleDetailedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageManager.saveFeedback({
      context,
      sentiment: sentiment || 'negative',
      category,
      comment: comment.trim() || undefined,
      units,
      predictedBill,
    });
    analytics.track('feedback_submitted', {
      sentiment: sentiment || 'negative',
      category,
      context,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/70 p-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>
            {lang === 'ml'
              ? 'നന്ദി! നിങ്ങളുടെ അഭിപ്രായം സ്വീകരിച്ചു.'
              : 'Thank you! Your feedback helps calibrate Kerala bill estimates.'}
          </span>
        </div>
        <p className="text-[11px] text-emerald-700/90 mt-0.5">
          {lang === 'ml'
            ? 'സ്വകാര്യത ഉറപ്പാക്കി വിവരങ്ങൾ സൂക്ഷിക്കുന്നു.'
            : 'Stored securely on your device with zero PII transmission.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--separator)] bg-[var(--surface-sunken)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--secondary)]" />
          <span className="text-xs font-semibold text-[var(--foreground)]">
            {lang === 'ml' ? 'ഈ കണക്കുകൂട്ടൽ കൃത്യമാണോ?' : 'Was this estimate helpful?'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleVote('positive')}
            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all touch-target ${
              sentiment === 'positive'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                : 'border-[var(--separator)] bg-[var(--surface)] text-[var(--foreground)] hover:border-black/20'
            }`}
            aria-label="Mark estimate as helpful"
          >
            <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
            <span>{lang === 'ml' ? 'അതെ' : 'Helpful'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleVote('negative')}
            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all touch-target ${
              sentiment === 'negative'
                ? 'border-rose-400 bg-rose-50 text-rose-800 shadow-2xs'
                : 'border-[var(--separator)] bg-[var(--surface)] text-[var(--foreground)] hover:border-black/20'
            }`}
            aria-label="Report estimate discrepancy"
          >
            <ThumbsDown className="h-3.5 w-3.5 text-rose-500" />
            <span>{lang === 'ml' ? 'വ്യത്യാസമുണ്ട്' : 'Inaccurate'}</span>
          </button>
        </div>
      </div>

      {showCommentBox && (
        <form onSubmit={handleDetailedSubmit} className="pt-2 border-t border-[var(--separator)] space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--secondary)]">
              {lang === 'ml' ? 'എന്താണ് പ്രശ്നം?' : 'What seemed off?'}
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as UserFeedbackCategory)}
              className="w-full rounded-xl border border-[var(--separator)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--foreground)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] transition-colors"
            >
              <option value="too_high">
                {lang === 'ml' ? 'തുക സാധാരണയേക്കാൾ കൂടുതലായി തോന്നുന്നു' : 'Estimate is higher than my usual bill'}
              </option>
              <option value="too_low">
                {lang === 'ml' ? 'തുക സാധാരണയേക്കാൾ കുറവാണ്' : 'Estimate is lower than expected'}
              </option>
              <option value="explanation_unclear">
                {lang === 'ml' ? 'സ്ലാബ് വിവരണം വ്യക്തമല്ല' : 'Slab breakdown or explanation unclear'}
              </option>
              <option value="scanner_error">
                {lang === 'ml' ? 'മീറ്റർ / ബിൽ സ്കാനിംഗ് റീഡിംഗ് തെറ്റാണ്' : 'Meter or bill scanner detected wrong number'}
              </option>
              <option value="tariff_query">
                {lang === 'ml' ? 'താരിഫ് നിരക്കിൽ സംശയം' : 'Tariff rate or subsidy question'}
              </option>
              <option value="other">
                {lang === 'ml' ? 'മറ്റ് അഭിപ്രായങ്ങൾ' : 'Other feedback'}
              </option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--secondary)]">
              <span>{lang === 'ml' ? 'കുറിപ്പ് (ഓപ്ഷണൽ)' : 'Optional notes'}</span>
              <span className="font-mono num-tabular">{comment.length}/300</span>
            </div>
            <textarea
              rows={2}
              maxLength={300}
              placeholder={
                lang === 'ml'
                  ? 'ഉദാ: കഴിഞ്ഞ മാസം ഇതേ യൂണിറ്റിന് ₹80 കുറവായിരുന്നു...'
                  : 'e.g. My previous bill for 240 units was ₹1,148...'
              }
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full rounded-xl border border-[var(--separator)] bg-[var(--surface)] p-2.5 text-xs text-[var(--foreground)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] resize-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-[10px] text-[var(--secondary)]">
              <ShieldAlert className="h-3 w-3 text-amber-600 shrink-0" />
              <span>{lang === 'ml' ? 'ഫോൺ/കൺസ്യൂമർ നമ്പർ നൽകരുത്' : 'No personal info or phone numbers'}</span>
            </div>

            <button
              type="submit"
              className="ios-btn-primary px-4 py-2 text-xs font-semibold"
            >
              {lang === 'ml' ? 'അയക്കൂ' : 'Send Feedback'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
