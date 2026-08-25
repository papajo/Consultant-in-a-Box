import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  ShieldCheck,
  FileQuestion,
  Lightbulb,
} from 'lucide-react';
import { RiskAssessment, RiskSeverity } from '../types/agent.ts';

interface RiskMatrixViewProps {
  riskAssessment: RiskAssessment;
}

export const RiskMatrixView: React.FC<RiskMatrixViewProps> = ({ riskAssessment }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const getSeverityBadge = (severity: RiskSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
            CRITICAL SEVERITY
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
            MODERATE SEVERITY
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
            LOW SEVERITY
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-stone-700 border border-stone-300">
            UNKNOWN
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Risk & Uncertainty Assessment Matrix
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Evaluates contractual scope traps, rate discrepancies, unstated requirements, and operational exposure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-mono">
            <span>Overall Risk:</span>
            <strong
              className={`font-bold ${
                riskAssessment.overallRiskLevel === 'HIGH'
                  ? 'text-rose-700'
                  : riskAssessment.overallRiskLevel === 'MODERATE'
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {riskAssessment.overallRiskLevel} ({riskAssessment.riskScore}/100)
            </strong>
          </div>
        </div>
      </div>

      {/* Identified Risk Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
          Identified Risk Factors ({riskAssessment.identifiedRisks.length})
        </h4>

        {riskAssessment.identifiedRisks.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No significant contractual, technical, or operational risks detected in this opportunity.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskAssessment.identifiedRisks.map((risk) => (
              <div
                key={risk.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-semibold uppercase text-stone-500">
                    Category: {risk.category}
                  </span>
                  {getSeverityBadge(risk.severity)}
                </div>

                <div>
                  <h5 className="text-xs font-bold text-stone-900">
                    {risk.title}
                  </h5>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {risk.description}
                  </p>
                </div>

                {risk.mitigationSuggestion && (
                  <div className="p-2.5 rounded-lg bg-white border border-stone-200/90 text-xs text-stone-700 space-y-1">
                    <div className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-600" />
                      Mitigation Strategy
                    </div>
                    <p className="text-[11px] leading-relaxed text-stone-800">
                      {risk.mitigationSuggestion}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Critical Clarification Questions Checklist */}
      <div className="p-5 rounded-xl bg-stone-900 text-stone-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Priority Pre-Bid Clarification Questions for Client
            </h4>
          </div>
          <span className="text-[11px] text-stone-400 font-mono">
            {riskAssessment.clarificationQuestionsForClient.length} questions
          </span>
        </div>
        <p className="text-xs text-stone-400 leading-relaxed">
          Ask these exact questions during the discovery call to eliminate unknowns and protect your engagement scope:
        </p>

        <div className="space-y-2 pt-1">
          {riskAssessment.clarificationQuestionsForClient.map((q, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-stone-800/80 border border-stone-700/80 text-xs text-stone-200"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold font-mono">
                  Q{idx + 1}.
                </span>
                <span className="leading-relaxed">{q}</span>
              </div>

              <button
                type="button"
                onClick={() => copyQuestion(q, idx)}
                className="shrink-0 p-1.5 rounded-md hover:bg-stone-700 text-stone-400 hover:text-white transition cursor-pointer"
                title="Copy question"
              >
                {copiedIdx === idx ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
