import React from 'react';
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  DollarSign,
  TrendingUp,
  FileText,
  Building,
  Award,
} from 'lucide-react';
import { PipelineOpportunity, OpportunityEvaluationReport } from '../types/agent.ts';

interface OpportunityComparisonViewProps {
  opportunities: PipelineOpportunity[];
  onBack: () => void;
  onSelectOpportunity: (report: OpportunityEvaluationReport) => void;
}

export const OpportunityComparisonView: React.FC<OpportunityComparisonViewProps> = ({
  opportunities,
  onBack,
  onSelectOpportunity,
}) => {
  if (opportunities.length === 0) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-stone-200 text-center space-y-3">
        <Layers className="w-8 h-8 text-stone-400 mx-auto" />
        <p className="text-sm font-semibold text-stone-800">No opportunities selected for comparison.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold cursor-pointer"
        >
          Back to Pipeline
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 font-medium mb-1 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Pipeline CRM</span>
          </button>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            Side-by-Side Opportunity Comparison Matrix
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Benchmarking {opportunities.length} opportunities across decision confidence, evidence match density, and risk exposure.
          </p>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="py-3 px-4 w-48 bg-stone-50 text-stone-500 uppercase font-semibold text-[10px] tracking-wider">
                Benchmark Metric
              </th>
              {opportunities.map((opp) => (
                <th key={opp.id} className="py-3 px-4 w-72 bg-stone-50/50">
                  <div className="space-y-1">
                    <div className="font-bold text-stone-900 text-sm">{opp.report.clientName}</div>
                    <div className="text-stone-500 text-[11px] truncate">{opp.report.opportunityTitle}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {/* Row 1: Decision & Score */}
            <tr>
              <td className="py-4 px-4 bg-stone-50/70 font-semibold text-stone-700">
                Decision & Score
              </td>
              {opportunities.map((opp) => {
                const rec = opp.report.recommendation;
                return (
                  <td key={opp.id} className="py-4 px-4 align-top">
                    <div className="space-y-1.5">
                      <span
                        className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold font-mono border ${
                          rec.decision === 'GO'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : rec.decision === 'PASS'
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {rec.decision} ({rec.opportunityScore}/100)
                      </span>
                      <div className="text-[11px] text-stone-600 leading-snug">
                        {rec.headline}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row 2: Estimated Value & Yield */}
            <tr>
              <td className="py-4 px-4 bg-stone-50/70 font-semibold text-stone-700">
                Commercial Value
              </td>
              {opportunities.map((opp) => (
                <td key={opp.id} className="py-4 px-4 align-top font-mono">
                  <div className="text-sm font-bold text-stone-900">
                    ${(opp.estimatedValueUsd || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Rate: ${opp.targetRateUsd || opp.report.consultantProfileSnapshot.preferences.minHourlyRateUsd}/hr
                  </div>
                </td>
              ))}
            </tr>

            {/* Row 3: Strong Evidence Matches */}
            <tr>
              <td className="py-4 px-4 bg-stone-50/70 font-semibold text-stone-700">
                Strong Requirement Matches
              </td>
              {opportunities.map((opp) => (
                <td key={opp.id} className="py-4 px-4 align-top space-y-1.5">
                  <div className="font-bold text-emerald-800 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {opp.report.fitAssessment.strongMatches.length} Matches
                  </div>
                  <ul className="space-y-1 text-[11px] text-stone-700">
                    {opp.report.fitAssessment.strongMatches.slice(0, 3).map((m, idx) => (
                      <li key={idx} className="line-clamp-2">
                        • {m.requirementText}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Row 4: Dealbreakers & Disqualifiers */}
            <tr>
              <td className="py-4 px-4 bg-stone-50/70 font-semibold text-stone-700">
                Disqualifiers & Gaps
              </td>
              {opportunities.map((opp) => {
                const disqs = opp.report.fitAssessment.disqualifiers;
                const gaps = opp.report.fitAssessment.gaps;
                return (
                  <td key={opp.id} className="py-4 px-4 align-top space-y-1.5">
                    {disqs.length > 0 ? (
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[11px] font-medium space-y-1">
                        <div className="font-bold text-[10px] uppercase flex items-center gap-1 text-rose-800">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          Fatal Disqualifier
                        </div>
                        {disqs.map((d, i) => (
                          <div key={i}>• {d.requirementText}: {d.explanation}</div>
                        ))}
                      </div>
                    ) : gaps.length > 0 ? (
                      <div className="text-[11px] text-amber-800">
                        {gaps.length} Minor Gaps ({gaps.map((g) => g.requirementText).slice(0, 2).join(', ')})
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-700 font-medium">
                        ✓ No blocking dealbreakers identified
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Row 5: Risk Level */}
            <tr>
              <td className="py-4 px-4 bg-stone-50/70 font-semibold text-stone-700">
                Risk Profile
              </td>
              {opportunities.map((opp) => {
                const risk = opp.report.riskAssessment;
                return (
                  <td key={opp.id} className="py-4 px-4 align-top space-y-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        risk.overallRiskLevel === 'HIGH'
                          ? 'bg-rose-100 text-rose-800'
                          : risk.overallRiskLevel === 'MODERATE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {risk.overallRiskLevel} RISK ({risk.riskScore}/100)
                    </span>
                    <div className="text-[11px] text-stone-600">
                      {risk.identifiedRisks.length} flagged risk items
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Action Row */}
            <tr>
              <td className="py-4 px-4 bg-stone-50/70 font-semibold text-stone-700">
                Action
              </td>
              {opportunities.map((opp) => (
                <td key={opp.id} className="py-4 px-4 align-top">
                  <button
                    type="button"
                    onClick={() => onSelectOpportunity(opp.report)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    Open Triage Report
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
