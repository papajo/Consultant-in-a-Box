import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldAlert,
  Search,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { FitAssessment, RequirementFitMatch, MatchStatus } from '../types/agent.ts';

interface FitMatrixViewProps {
  fitAssessment: FitAssessment;
}

export const FitMatrixView: React.FC<FitMatrixViewProps> = ({ fitAssessment }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allMatches: RequirementFitMatch[] = [
    ...fitAssessment.disqualifiers,
    ...fitAssessment.strongMatches,
    ...fitAssessment.partialMatches,
    ...fitAssessment.gaps,
    ...fitAssessment.unverified,
  ];

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'strong_match':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Strong Match
          </span>
        );
      case 'partial_match':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <CheckCheck className="w-3.5 h-3.5" /> Partial Match
          </span>
        );
      case 'gap':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" /> Gap
          </span>
        );
      case 'disqualifier':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" /> Disqualifier
          </span>
        );
      case 'unverified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300">
            <HelpCircle className="w-3.5 h-3.5" /> Unverified
          </span>
        );
    }
  };

  const getClassificationBadge = (classification: string, mandatory: boolean) => {
    if (mandatory || classification === 'hard') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-900 text-white tracking-wide">
          MANDATORY
        </span>
      );
    }
    if (classification === 'preferred') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-stone-100 text-stone-700 border border-stone-200">
          PREFERRED
        </span>
      );
    }
    if (classification === 'inferred') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
          INFERRED
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-stone-50 text-stone-500 border border-stone-200">
        UNKNOWN
      </span>
    );
  };

  const filteredMatches = allMatches.filter((match) => {
    if (filterStatus !== 'all' && match.matchStatus !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        match.requirementText.toLowerCase().includes(q) ||
        match.profileEvidence.toLowerCase().includes(q) ||
        match.explanation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
      {/* Header with Title and Search/Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <span>Evidence-Backed Requirement Match Matrix</span>
            <span className="text-xs font-normal text-stone-500">
              ({allMatches.length} extracted requirements)
            </span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Every match, gap, and disqualifier is strictly traced to specific profile evidence and past projects.
          </p>
        </div>

        {/* Search Field */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="matrix-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requirements or evidence..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 pb-3 text-xs">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-stone-900 text-white'
              : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
          }`}
        >
          All ({allMatches.length})
        </button>

        {fitAssessment.disqualifiers.length > 0 && (
          <button
            type="button"
            onClick={() => setFilterStatus('disqualifier')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filterStatus === 'disqualifier'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Disqualifiers ({fitAssessment.disqualifiers.length})
          </button>
        )}

        <button
          type="button"
          onClick={() => setFilterStatus('strong_match')}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
            filterStatus === 'strong_match'
              ? 'bg-emerald-700 text-white'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          Strong Matches ({fitAssessment.strongMatches.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('partial_match')}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
            filterStatus === 'partial_match'
              ? 'bg-sky-700 text-white'
              : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
          }`}
        >
          Partial Matches ({fitAssessment.partialMatches.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('gap')}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
            filterStatus === 'gap'
              ? 'bg-amber-700 text-white'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          Gaps ({fitAssessment.gaps.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('unverified')}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
            filterStatus === 'unverified'
              ? 'bg-stone-700 text-white'
              : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          Unverified ({fitAssessment.unverified.length})
        </button>
      </div>

      {/* Structured Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 w-28">Type</th>
              <th className="py-3 px-4 w-2/5">Extracted Requirement</th>
              <th className="py-3 px-4 w-2/5">Consultant Evidence Citation</th>
              <th className="py-3 px-4 w-32 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredMatches.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-stone-400">
                  No matching requirements for selected filter.
                </td>
              </tr>
            ) : (
              filteredMatches.map((match, idx) => (
                <tr
                  key={match.requirementId || idx}
                  className={`hover:bg-stone-50/70 transition-colors ${
                    match.matchStatus === 'disqualifier' ? 'bg-rose-50/40' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 align-top">
                    {getClassificationBadge(match.classification, match.mandatory)}
                  </td>
                  <td className="py-3.5 px-4 align-top space-y-1">
                    <p className="font-semibold text-stone-900 leading-snug">
                      {match.requirementText}
                    </p>
                    {match.explanation && (
                      <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                        Rationale: {match.explanation}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 align-top space-y-1">
                    <div className="p-2 rounded-lg bg-stone-50 border border-stone-200/80 text-[11px] font-mono text-stone-800 leading-relaxed">
                      {match.profileEvidence || 'No matching record found in profile.'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top text-center">
                    {getStatusBadge(match.matchStatus)}
                    <div className="text-[10px] text-stone-400 mt-1 font-mono">
                      Conf: {match.confidence}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
