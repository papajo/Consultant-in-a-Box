/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  FileCheck2,
  Globe,
  ShieldAlert,
  ListOrdered,
  RotateCcw,
  AlertCircle,
  FileText,
  MessageSquare,
  Briefcase,
  Sliders,
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { OpportunityInput } from './components/OpportunityInput.tsx';
import { AgentActivityTimeline } from './components/AgentActivityTimeline.tsx';
import { DecisionBanner } from './components/DecisionBanner.tsx';
import { FitMatrixView } from './components/FitMatrixView.tsx';
import { ResearchDossierView } from './components/ResearchDossierView.tsx';
import { RiskMatrixView } from './components/RiskMatrixView.tsx';
import { ProposalGeneratorView } from './components/ProposalGeneratorView.tsx';
import { OpportunityChatDrawer } from './components/OpportunityChatDrawer.tsx';
import { PipelineCRMView } from './components/PipelineCRMView.tsx';
import { OpportunityComparisonView } from './components/OpportunityComparisonView.tsx';
import { ConsultantProfileModal } from './components/ConsultantProfileModal.tsx';
import { ScoringConfigModal } from './components/ScoringConfigModal.tsx';
import { ExportReportModal } from './components/ExportReportModal.tsx';
import { DEFAULT_PROFILES, DEFAULT_ACTIVE_PROFILE } from './data/defaultProfiles.ts';
import { SAMPLE_RFPS } from './data/sampleRFPs.ts';
import {
  ConsultantProfile,
  OpportunityEvaluationReport,
  AgentActivity,
  PipelineOpportunity,
  PipelineStage,
  ScoringWeightsConfig,
} from './types/agent.ts';

const DEFAULT_SCORING_CONFIG: ScoringWeightsConfig = {
  skillsWeight: 35,
  experienceWeight: 25,
  commercialWeight: 20,
  riskTolerance: 'balanced',
  strictDisqualifiers: true,
};

export default function App() {
  const [activeProfile, setActiveProfile] = useState<ConsultantProfile>(() => {
    const saved = localStorage.getItem('consultant_active_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_ACTIVE_PROFILE;
      }
    }
    return DEFAULT_ACTIVE_PROFILE;
  });

  const [scoringConfig, setScoringConfig] = useState<ScoringWeightsConfig>(() => {
    const saved = localStorage.getItem('consultant_scoring_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_SCORING_CONFIG;
      }
    }
    return DEFAULT_SCORING_CONFIG;
  });

  // Main App View: 'triage' | 'pipeline' | 'compare'
  const [currentView, setCurrentView] = useState<'triage' | 'pipeline' | 'compare'>('triage');

  // Evaluator State
  const [opportunityText, setOpportunityText] = useState<string>(SAMPLE_RFPS[0].content);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<string>('IDLE');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [report, setReport] = useState<OpportunityEvaluationReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Detail Tab in Triage
  const [activeTab, setActiveTab] = useState<'fit' | 'research' | 'risk' | 'proposal'>('fit');

  // Pipeline CRM State
  const [pipeline, setPipeline] = useState<PipelineOpportunity[]>(() => {
    const saved = localStorage.getItem('consultant_pipeline');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Comparison State
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Modals & Drawers
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isScoringModalOpen, setIsScoringModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('consultant_active_profile', JSON.stringify(activeProfile));
  }, [activeProfile]);

  useEffect(() => {
    localStorage.setItem('consultant_scoring_config', JSON.stringify(scoringConfig));
  }, [scoringConfig]);

  useEffect(() => {
    localStorage.setItem('consultant_pipeline', JSON.stringify(pipeline));
  }, [pipeline]);

  // When a report completes, auto-record/update in Pipeline CRM
  const recordReportInPipeline = (newReport: OpportunityEvaluationReport) => {
    setPipeline((prev) => {
      const existingIdx = prev.findIndex((p) => p.report.opportunityTitle === newReport.opportunityTitle);
      const stage: PipelineStage =
        newReport.recommendation.decision === 'GO'
          ? 'pursuing'
          : newReport.recommendation.decision === 'PASS'
          ? 'passed'
          : 'evaluating';

      const estimatedHours = 120; // default estimated discovery/project sprint
      const targetRate = newReport.consultantProfileSnapshot.preferences.minHourlyRateUsd;
      const estimatedValue = estimatedHours * targetRate;

      const item: PipelineOpportunity = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `opp-${Date.now()}`,
        report: newReport,
        stage: existingIdx >= 0 ? prev[existingIdx].stage : stage,
        notes: existingIdx >= 0 ? prev[existingIdx].notes : `${newReport.recommendation.decision} - ${newReport.recommendation.headline}`,
        tags: [newReport.recommendation.decision, newReport.clientName],
        targetRateUsd: targetRate,
        estimatedHours,
        estimatedValueUsd: estimatedValue,
        createdAt: existingIdx >= 0 ? prev[existingIdx].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = item;
        return copy;
      }
      return [item, ...prev];
    });
  };

  const handleReset = () => {
    setReport(null);
    setActivities([]);
    setProgressPercent(0);
    setCurrentPhase('IDLE');
    setErrorMessage(null);
    setActiveTab('fit');
  };

  const handleEvaluate = async () => {
    if (!opportunityText.trim()) return;

    setIsEvaluating(true);
    setReport(null);
    setActivities([]);
    setProgressPercent(5);
    setCurrentPhase('EXTRACT');
    setErrorMessage(null);
    setActiveTab('fit');

    try {
      const response = await fetch('/api/evaluate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: opportunityText,
          profile: activeProfile,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          const eventMatch = block.match(/^event:\s*(.+)$/m);
          const dataMatch = block.match(/^data:\s*(.+)$/m);

          const eventType = eventMatch ? eventMatch[1].trim() : 'message';
          const rawData = dataMatch ? dataMatch[1].trim() : '{}';

          try {
            const data = JSON.parse(rawData);
            if (eventType === 'activity') {
              setActivities((prev) => {
                if (prev.some((a) => a.id === data.id)) return prev;
                return [...prev, data];
              });
            } else if (eventType === 'progress') {
              setCurrentPhase(data.phase);
              setProgressPercent(data.percent);
            } else if (eventType === 'complete') {
              setReport(data);
              setProgressPercent(100);
              recordReportInPipeline(data);
            } else if (eventType === 'error') {
              setErrorMessage(data.message || 'Evaluation failed.');
            }
          } catch (parseErr) {
            console.warn('[SSE] Parse warning:', parseErr, block);
          }
        }
      }
    } catch (err: any) {
      console.error('[Evaluation] SSE failed, attempting sync fallback:', err);
      try {
        const syncRes = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: opportunityText,
            profile: activeProfile,
          }),
        });
        if (syncRes.ok) {
          const reportData = await syncRes.json();
          setReport(reportData);
          setActivities(reportData.activityTrail || []);
          setProgressPercent(100);
          recordReportInPipeline(reportData);
          return;
        }
      } catch (syncErr) {
        console.error('[Evaluation] Sync fallback failed:', syncErr);
      }

      setErrorMessage(err.message || 'An error occurred while evaluating the opportunity.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSelectReportFromPipeline = (selectedReport: OpportunityEvaluationReport) => {
    setReport(selectedReport);
    setOpportunityText(selectedReport.rawInputSnippet || SAMPLE_RFPS[0].content);
    setActivities(selectedReport.activityTrail || []);
    setProgressPercent(100);
    setCurrentPhase('COMPLETED');
    setCurrentView('triage');
  };

  const handleStartComparison = (ids: string[]) => {
    setCompareIds(ids);
    setCurrentView('compare');
  };

  const comparedOpportunities = pipeline.filter((p) => compareIds.includes(p.id));

  return (
    <div className="min-h-screen bg-stone-100/80 text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-stone-900">
      {/* Top Navigation Bar */}
      <Header
        activeProfile={activeProfile}
        currentView={currentView}
        onChangeView={setCurrentView}
        pipelineCount={pipeline.length}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenScoringModal={() => setIsScoringModalOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        hasActiveReport={!!report}
        onReset={handleReset}
        isEvaluating={isEvaluating}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-900 font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View 1: Triage Hub (Evaluator + Decision Engine + Proposal Generator) */}
        {currentView === 'triage' && (
          <div className="space-y-8">
            {/* Opportunity Document Input */}
            <OpportunityInput
              opportunityText={opportunityText}
              onChangeText={setOpportunityText}
              onEvaluate={handleEvaluate}
              isEvaluating={isEvaluating}
              activeProfile={activeProfile}
            />

            {/* Live Agent Activity Pipeline */}
            <AgentActivityTimeline
              activities={activities}
              progressPercent={progressPercent}
              currentPhase={currentPhase}
              isEvaluating={isEvaluating}
            />

            {/* Evaluated Opportunity Report */}
            {report && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                {/* Decision & Scoring Banner */}
                <DecisionBanner
                  report={report}
                  onOpenExportModal={() => setIsExportModalOpen(true)}
                />

                {/* Sub-Navigation Tabs */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        id="tab-fit-matrix"
                        onClick={() => setActiveTab('fit')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition cursor-pointer border ${
                          activeTab === 'fit'
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Evidence Fit Matrix</span>
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/10 text-[10px]">
                          {report.fitAssessment.strongMatches.length +
                            report.fitAssessment.disqualifiers.length +
                            report.fitAssessment.partialMatches.length +
                            report.fitAssessment.gaps.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        id="tab-client-research"
                        onClick={() => setActiveTab('research')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition cursor-pointer border ${
                          activeTab === 'research'
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Client Diligence & Grounding</span>
                        {report.research.sources.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 text-[10px]">
                            {report.research.sources.length} sources
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        id="tab-risk-matrix"
                        onClick={() => setActiveTab('risk')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition cursor-pointer border ${
                          activeTab === 'risk'
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Risk Matrix & Client Questions</span>
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 text-[10px]">
                          {report.riskAssessment.identifiedRisks.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        id="tab-proposal-generator"
                        onClick={() => setActiveTab('proposal')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition cursor-pointer border ${
                          activeTab === 'proposal'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Proposal & Pitch Package</span>
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-800/20 text-[10px] uppercase font-mono">
                          AI
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCopilotOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ask AI Copilot</span>
                    </button>
                  </div>

                  {/* Tab Panes */}
                  {activeTab === 'fit' && <FitMatrixView fitAssessment={report.fitAssessment} />}
                  {activeTab === 'research' && <ResearchDossierView research={report.research} />}
                  {activeTab === 'risk' && <RiskMatrixView riskAssessment={report.riskAssessment} />}
                  {activeTab === 'proposal' && <ProposalGeneratorView report={report} />}
                </div>
              </div>
            )}
          </div>
        )}

        {/* View 2: Pipeline CRM */}
        {currentView === 'pipeline' && (
          <PipelineCRMView
            pipeline={pipeline}
            onUpdatePipeline={setPipeline}
            onSelectReport={handleSelectReportFromPipeline}
            onStartComparison={handleStartComparison}
            onNavigateToEvaluator={() => setCurrentView('triage')}
          />
        )}

        {/* View 3: Opportunity Comparison Matrix */}
        {currentView === 'compare' && (
          <OpportunityComparisonView
            opportunities={comparedOpportunities}
            onBack={() => setCurrentView('pipeline')}
            onSelectOpportunity={handleSelectReportFromPipeline}
          />
        )}
      </main>

      {/* Profile Management Modal */}
      <ConsultantProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        activeProfile={activeProfile}
        onSaveProfile={(updated) => setActiveProfile(updated)}
      />

      {/* Scoring Configuration Modal */}
      <ScoringConfigModal
        isOpen={isScoringModalOpen}
        onClose={() => setIsScoringModalOpen(false)}
        config={scoringConfig}
        onSaveConfig={(cfg) => setScoringConfig(cfg)}
      />

      {/* Export Report Modal */}
      {report && (
        <ExportReportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          report={report}
        />
      )}

      {/* AI Strategic Copilot Drawer */}
      {report && (
        <OpportunityChatDrawer
          report={report}
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/80 py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Consultant-in-a-Box</strong> • Production Multi-Agent Consulting Decision Engine
          </div>
          <div className="flex items-center gap-4 text-stone-400 font-mono text-[11px]">
            <span>Google GenAI SDK (@google/genai)</span>
            <span>•</span>
            <span>Gemini 3.7 Flash</span>
            <span>•</span>
            <span>Search Grounding</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
