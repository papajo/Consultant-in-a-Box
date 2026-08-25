import React from 'react';
import { Globe, ExternalLink, ShieldCheck, AlertCircle, Cpu, Newspaper, CheckCircle2 } from 'lucide-react';
import { ResearchDossier } from '../types/agent.ts';

interface ResearchDossierViewProps {
  research: ResearchDossier;
}

export const ResearchDossierView: React.FC<ResearchDossierViewProps> = ({ research }) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              Client Intelligence & Market Research Dossier
            </h3>
            {research.isResearched && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Grounding Verified
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Autonomous external investigation into entity stability, tech stack, and corporate reputation.
          </p>
        </div>

        <div className="text-xs font-mono text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
          Target: <strong className="text-stone-900">{research.clientName}</strong>
        </div>
      </div>

      {/* Grid of Intel Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Block 1: Overview & Reputation */}
        <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80 space-y-2">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Corporate Profile & Industry Standing
          </h4>
          <p className="text-xs text-stone-700 leading-relaxed">
            {research.clientOverview}
          </p>
          <div className="pt-2 border-t border-stone-200/60 text-xs text-stone-600">
            <strong className="text-stone-800">Reputation Assessment:</strong> {research.industryReputation}
          </div>
        </div>

        {/* Block 2: Tech Stack Insights */}
        <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80 space-y-2">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-600" />
            Observed Tech Stack & Engineering Culture
          </h4>
          <ul className="space-y-1.5 text-xs text-stone-700">
            {research.techStackInsights.length > 0 ? (
              research.techStackInsights.map((tech, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{tech}</span>
                </li>
              ))
            ) : (
              <li className="text-stone-400 italic">No specific external tech disclosures found.</li>
            )}
          </ul>
        </div>

        {/* Block 3: Recent News & Initiatives */}
        <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80 space-y-2">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Newspaper className="w-4 h-4 text-sky-600" />
            Recent Business & Tech Initiatives
          </h4>
          <ul className="space-y-1.5 text-xs text-stone-700">
            {research.recentNewsOrInitiatives.length > 0 ? (
              research.recentNewsOrInitiatives.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-sky-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-stone-400 italic">No recent disruptive news reported.</li>
            )}
          </ul>
        </div>

        {/* Block 4: Potential Red Flags */}
        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-2">
          <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Diligence Alerts & Risk Signals
          </h4>
          <ul className="space-y-1.5 text-xs text-stone-700">
            {research.potentialRedFlags.length > 0 ? (
              research.potentialRedFlags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2 text-rose-900 font-medium">
                  <span className="text-rose-500 font-bold">!</span>
                  <span>{flag}</span>
                </li>
              ))
            ) : (
              <li className="text-emerald-700 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> No critical vendor red flags or payment controversies flagged.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Sources & Citations */}
      {research.sources.length > 0 && (
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Google Grounding Web Sources ({research.sources.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {research.sources.map((src, idx) => (
              <a
                key={idx}
                href={src.uri}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono transition"
              >
                <ExternalLink className="w-3 h-3 text-stone-500" />
                <span className="truncate max-w-xs">{src.title || src.uri}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
