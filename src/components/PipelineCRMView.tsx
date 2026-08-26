import React, { useState } from 'react';
import {
  Briefcase,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  ArrowUpDown,
  FileText,
  DollarSign,
  Clock,
  Tag,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { PipelineOpportunity, PipelineStage, OpportunityEvaluationReport } from '../types/agent.ts';

interface PipelineCRMViewProps {
  pipeline: PipelineOpportunity[];
  onUpdatePipeline: (pipeline: PipelineOpportunity[]) => void;
  onSelectReport: (report: OpportunityEvaluationReport) => void;
  onStartComparison: (selectedIds: string[]) => void;
  onNavigateToEvaluator: () => void;
}

const STAGE_LABELS: Record<PipelineStage, { label: string; color: string; bg: string }> = {
  evaluating: { label: 'Under Triage', color: 'text-stone-700', bg: 'bg-stone-100 border-stone-300' },
  pursuing: { label: 'Pursuing / Bidding', color: 'text-sky-800', bg: 'bg-sky-50 border-sky-300' },
  discovery_scheduled: { label: 'Discovery Scheduled', color: 'text-indigo-800', bg: 'bg-indigo-50 border-indigo-300' },
  proposal_submitted: { label: 'Proposal Submitted', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-300' },
  won: { label: 'Won / Engaged', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-300' },
  passed: { label: 'Passed / Declined', color: 'text-rose-800', bg: 'bg-rose-50 border-rose-300' },
  archived: { label: 'Archived', color: 'text-stone-500', bg: 'bg-stone-50 border-stone-200' },
};

export const PipelineCRMView: React.FC<PipelineCRMViewProps> = ({
  pipeline,
  onUpdatePipeline,
  onSelectReport,
  onStartComparison,
  onNavigateToEvaluator,
}) => {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  // Calculate Metrics
  const activePipeline = pipeline.filter((p) => p.stage !== 'passed' && p.stage !== 'archived');
  const totalValue = activePipeline.reduce((acc, p) => acc + (p.estimatedValueUsd || 0), 0);
  const avgScore =
    pipeline.length > 0
      ? Math.round(
          pipeline.reduce((acc, p) => acc + p.report.recommendation.opportunityScore, 0) /
            pipeline.length
        )
      : 0;
  const goDecisions = pipeline.filter((p) => p.report.recommendation.decision === 'GO').length;
  const winCount = pipeline.filter((p) => p.stage === 'won').length;

  const filtered = pipeline.filter((item) => {
    if (selectedStage !== 'all' && item.stage !== selectedStage) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.report.clientName.toLowerCase().includes(q) ||
        item.report.opportunityTitle.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStageChange = (id: string, newStage: PipelineStage) => {
    const updated = pipeline.map((item) =>
      item.id === id ? { ...item, stage: newStage, updatedAt: new Date().toISOString() } : item
    );
    onUpdatePipeline(updated);
  };

  const handleDelete = (id: string) => {
    const updated = pipeline.filter((item) => item.id !== id);
    onUpdatePipeline(updated);
    setSelectedForCompare((prev) => prev.filter((i) => i !== id));
  };

  const handleSaveNotes = (id: string) => {
    const updated = pipeline.map((item) =>
      item.id === id ? { ...item, notes: noteText, updatedAt: new Date().toISOString() } : item
    );
    onUpdatePipeline(updated);
    setEditingNoteId(null);
  };

  const toggleCompare = (id: string) => {
    setSelectedForCompare((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
            <span>Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-stone-900 font-mono">
            ${totalValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500">
            Across {activePipeline.length} active opportunities
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
            <span>Average Fit Score</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold text-stone-900 font-mono">
            {avgScore} / 100
          </div>
          <div className="text-[11px] text-stone-500">
            {goDecisions} High-confidence GO verdicts
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Evaluated</span>
            <Briefcase className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-stone-900 font-mono">
            {pipeline.length}
          </div>
          <div className="text-[11px] text-stone-500">
            {pipeline.filter((p) => p.report.recommendation.decision === 'PASS').length} Filtered out
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
            <span>Won Engagements</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800 font-mono">
            {winCount}
          </div>
          <div className="text-[11px] text-stone-500">
            {pipeline.length > 0 ? `${Math.round((winCount / pipeline.length) * 100)}% Win Rate` : '0%'}
          </div>
        </div>
      </div>

      {/* Main CRM Controls & Filter Header */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-stone-700" />
              Opportunities Pipeline & CRM
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Track, tag, and manage past evaluated RFPs through active client stages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedForCompare.length >= 2 && (
              <button
                type="button"
                onClick={() => onStartComparison(selectedForCompare)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>Compare Selected ({selectedForCompare.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onNavigateToEvaluator}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Evaluate New RFP</span>
            </button>
          </div>
        </div>

        {/* Search & Stage Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setSelectedStage('all')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                selectedStage === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              All ({pipeline.length})
            </button>
            {(Object.keys(STAGE_LABELS) as PipelineStage[]).map((st) => {
              const count = pipeline.filter((p) => p.stage === st).length;
              if (count === 0 && selectedStage !== st) return null;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStage(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    selectedStage === st
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {STAGE_LABELS[st].label} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, title, tags..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400"
            />
          </div>
        </div>
      </div>

      {/* Pipeline Opportunities List / Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-stone-200 text-stone-500 space-y-3">
          <Briefcase className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-sm font-semibold text-stone-800">No opportunities match this filter.</p>
          <p className="text-xs text-stone-500">
            Run an evaluation in the Triage Hub to automatically record it in your pipeline.
          </p>
          <button
            type="button"
            onClick={onNavigateToEvaluator}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Evaluate First RFP</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const rep = item.report;
            const rec = rep.recommendation;
            const isComparing = selectedForCompare.includes(item.id);

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl bg-white border transition shadow-xs space-y-3 ${
                  isComparing ? 'border-amber-400 ring-2 ring-amber-100' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Top Row: Client & Decision Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* Compare Checkbox */}
                    <input
                      type="checkbox"
                      checked={isComparing}
                      onChange={() => toggleCompare(item.id)}
                      className="w-4 h-4 rounded text-amber-600 border-stone-300 focus:ring-0 cursor-pointer"
                      title="Select for comparison (up to 3)"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-900 hover:text-amber-700 transition cursor-pointer"
                            onClick={() => onSelectReport(rep)}>
                          {rep.opportunityTitle}
                        </h4>
                        <span className="text-xs font-medium text-stone-500 font-mono">
                          • {rep.clientName}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                        {rec.headline}
                      </p>
                    </div>
                  </div>

                  {/* Decision & Score Pill */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono uppercase tracking-wide border ${
                        rec.decision === 'GO'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : rec.decision === 'PASS'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {rec.decision} ({rec.opportunityScore}/100)
                    </span>

                    {/* Stage Selector Dropdown */}
                    <select
                      value={item.stage}
                      onChange={(e) => handleStageChange(item.id, e.target.value as PipelineStage)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                        STAGE_LABELS[item.stage].bg
                      } ${STAGE_LABELS[item.stage].color}`}
                    >
                      {(Object.keys(STAGE_LABELS) as PipelineStage[]).map((st) => (
                        <option key={st} value={st}>
                          {STAGE_LABELS[st].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-stone-50/80 p-3 rounded-xl border border-stone-200/70 font-mono text-stone-700">
                  <div>
                    <span className="text-[10px] uppercase text-stone-400 block">Est. Value</span>
                    <strong className="text-stone-900">${(item.estimatedValueUsd || 0).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-stone-400 block">Target Rate</span>
                    <strong className="text-stone-900">${item.targetRateUsd || rep.consultantProfileSnapshot.preferences.minHourlyRateUsd}/hr</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-stone-400 block">Strong Matches</span>
                    <strong className="text-emerald-700">{rep.fitAssessment.strongMatches.length} reqs</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-stone-400 block">Risk Level</span>
                    <strong className={rep.riskAssessment.overallRiskLevel === 'HIGH' ? 'text-rose-700' : 'text-stone-900'}>
                      {rep.riskAssessment.overallRiskLevel} ({rep.riskAssessment.identifiedRisks.length})
                    </strong>
                  </div>
                </div>

                {/* Notes & Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 flex-1 text-xs">
                    {editingNoteId === item.id ? (
                      <div className="flex items-center gap-2 w-full max-w-md">
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add internal engagement note..."
                          className="flex-1 px-2.5 py-1 rounded-md border border-stone-300 text-xs text-stone-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(item.id)}
                          className="px-2.5 py-1 rounded-md bg-stone-900 text-white text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="text-stone-500 hover:text-stone-800 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingNoteId(item.id);
                          setNoteText(item.notes);
                        }}
                        className="text-stone-500 hover:text-stone-800 text-[11px] cursor-pointer italic truncate max-w-md"
                      >
                        {item.notes ? `Note: "${item.notes}"` : '+ Add note / next step...'}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectReport(rep)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-stone-500" />
                      <span>View Full Triage</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete from pipeline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
