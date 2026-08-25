import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  HelpCircle,
  FileDown,
  Info,
} from 'lucide-react';
import { RecommendationResult, OpportunityEvaluationReport } from '../types/agent.ts';

interface DecisionBannerProps {
  report: OpportunityEvaluationReport;
  onOpenExportModal: () => void;
}

export const DecisionBanner: React.FC<DecisionBannerProps> = ({
  report,
  onOpenExportModal,
}) => {
  const { recommendation, extraction, fitAssessment } = report;
  const { decision, confidence, opportunityScore, scoreBreakdown, headline, executiveSummary, keyStrengths, criticalGaps, primaryRisks, dealBreakers, suggestedNextSteps } = recommendation;

  const getDecisionTheme = (dec: typeof decision) => {
    switch (dec) {
      case 'GO':
        return {
          bg: 'bg-emerald-50/80 border-emerald-300 ring-emerald-600/10',
          badgeBg: 'bg-emerald-600 text-white',
          textColor: 'text-emerald-950',
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
          accentText: 'text-emerald-700',
          scoreBadge: 'text-emerald-700 bg-emerald-100/80 border-emerald-300',
        };
      case 'REVIEW':
        return {
          bg: 'bg-amber-50/80 border-amber-300 ring-amber-600/10',
          badgeBg: 'bg-amber-600 text-white',
          textColor: 'text-amber-950',
          icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
          accentText: 'text-amber-700',
          scoreBadge: 'text-amber-800 bg-amber-100/80 border-amber-300',
        };
      case 'PASS':
        return {
          bg: 'bg-rose-50/80 border-rose-300 ring-rose-600/10',
          badgeBg: 'bg-rose-600 text-white',
          textColor: 'text-rose-950',
          icon: <XCircle className="w-8 h-8 text-rose-600" />,
          accentText: 'text-rose-700',
          scoreBadge: 'text-rose-700 bg-rose-100/80 border-rose-300',
        };
    }
  };

  const theme = getDecisionTheme(decision);

  return (
    <div className={`rounded-2xl border p-6 shadow-sm space-y-6 ring-1 ${theme.bg}`}>
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Decision Badge & Headline */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-xs border border-stone-200/80 shrink-0">
            {theme.icon}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-4 py-1.5 rounded-xl font-extrabold text-base tracking-wider uppercase shadow-xs ${theme.badgeBg}`}>
                RECOMMENDATION: {decision}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-white/90 border border-stone-300 text-stone-700">
                Confidence: <strong className="text-stone-900">{confidence}</strong>
              </span>
            </div>
            <h3 className={`text-lg font-bold mt-2 ${theme.textColor}`}>
              {headline}
            </h3>
            <p className="text-xs text-stone-600 font-mono mt-0.5">
              Client: <strong className="text-stone-800">{extraction.clientName || 'Target Enterprise'}</strong> • Opportunity: {extraction.opportunityTitle}
            </p>
          </div>
        </div>

        {/* Right: Score Box & Export CTA */}
        <div className="flex items-center gap-4 self-end lg:self-center">
          <div className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border bg-white shadow-xs min-w-[120px] ${theme.scoreBadge}`}>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Opportunity Score
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-extrabold text-stone-900">
                {opportunityScore}
              </span>
              <span className="text-xs font-semibold text-stone-400">/ 100</span>
            </div>
          </div>

          <button
            id="export-report-button"
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="p-4 bg-white/90 rounded-xl border border-stone-200/90 text-xs text-stone-700 leading-relaxed space-y-1.5">
        <div className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-stone-500" />
          Executive Rationale & Evidence Synthesis
        </div>
        <p className="text-stone-800 text-xs leading-relaxed">
          {executiveSummary}
        </p>
      </div>

      {/* Score Breakdown Bars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/70 p-3.5 rounded-xl border border-stone-200/70">
        <div>
          <div className="text-[10px] text-stone-500 font-semibold uppercase">
            Skills Fit (35%)
          </div>
          <div className="text-base font-bold text-stone-900">
            {scoreBreakdown.skillsFitScore}/100
          </div>
        </div>
        <div>
          <div className="text-[10px] text-stone-500 font-semibold uppercase">
            Experience Fit (25%)
          </div>
          <div className="text-base font-bold text-stone-900">
            {scoreBreakdown.experienceFitScore}/100
          </div>
        </div>
        <div>
          <div className="text-[10px] text-stone-500 font-semibold uppercase">
            Commercial Terms (20%)
          </div>
          <div className="text-base font-bold text-stone-900">
            {scoreBreakdown.commercialFitScore}/100
          </div>
        </div>
        <div>
          <div className="text-[10px] text-stone-500 font-semibold uppercase">
            Risk Adjustment (Penalty)
          </div>
          <div className="text-base font-bold text-rose-700">
            -{Math.round(scoreBreakdown.riskAdjustment)} pts
          </div>
        </div>
      </div>

      {/* 4-Box Key Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box 1: Strengths */}
        <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Key Strengths ({keyStrengths.length})
          </h4>
          <ul className="space-y-1.5 text-xs text-stone-700">
            {keyStrengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Box 2: Critical Gaps / Dealbreakers */}
        <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
          <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {dealBreakers.length > 0 ? `Dealbreakers (${dealBreakers.length})` : `Identified Gaps (${criticalGaps.length})`}
          </h4>
          <ul className="space-y-1.5 text-xs text-stone-700">
            {dealBreakers.length > 0
              ? dealBreakers.map((db, idx) => (
                  <li key={idx} className="flex items-start gap-2 font-semibold text-rose-800">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>{db}</span>
                  </li>
                ))
              : criticalGaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
            {dealBreakers.length === 0 && criticalGaps.length === 0 && (
              <li className="text-stone-400 italic">No significant gaps detected against profile.</li>
            )}
          </ul>
        </div>

        {/* Box 3: Primary Risks */}
        <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Primary Risks ({primaryRisks.length})
          </h4>
          <ul className="space-y-1.5 text-xs text-stone-700">
            {primaryRisks.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>{risk}</span>
              </li>
            ))}
            {primaryRisks.length === 0 && (
              <li className="text-stone-400 italic">Low operational risk profile.</li>
            )}
          </ul>
        </div>

        {/* Box 4: Suggested Next Steps */}
        <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
          <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-stone-600" />
            Recommended Next Steps
          </h4>
          <ul className="space-y-1.5 text-xs text-stone-700">
            {suggestedNextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-stone-500 font-bold">{idx + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
