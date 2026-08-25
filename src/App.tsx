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
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { OpportunityInput } from './components/OpportunityInput.tsx';
import { AgentActivityTimeline } from './components/AgentActivityTimeline.tsx';
import { DecisionBanner } from './components/DecisionBanner.tsx';
import { FitMatrixView } from './components/FitMatrixView.tsx';
import { ResearchDossierView } from './components/ResearchDossierView.tsx';
import { RiskMatrixView } from './components/RiskMatrixView.tsx';
import { ConsultantProfileModal } from './components/ConsultantProfileModal.tsx';
import { ExportReportModal } from './components/ExportReportModal.tsx';
import { DEFAULT_PROFILES, DEFAULT_ACTIVE_PROFILE } from './data/defaultProfiles.ts';
import { SAMPLE_RFPS } from './data/sampleRFPs.ts';
import {
  ConsultantProfile,
  OpportunityEvaluationReport,
  AgentActivity,
} from './types/agent.ts';

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

  const [opportunityText, setOpportunityText] = useState<string>(SAMPLE_RFPS[0].content);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<string>('IDLE');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [report, setReport] = useState<OpportunityEvaluationReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Detail Tab
  const [activeTab, setActiveTab] = useState<'fit' | 'research' | 'risk' | 'audit'>('fit');

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Save profile to local storage on change
  useEffect(() => {
    localStorage.setItem('consultant_active_profile', JSON.stringify(activeProfile));
  }, [activeProfile]);

  const handleReset = () => {
    setReport(null);
    setActivities([]);
    setProgressPercent(0);
    setCurrentPhase('IDLE');
    setErrorMessage(null);
  };

  const handleEvaluate = async () => {
    if (!opportunityText.trim()) return;

    setIsEvaluating(true);
    setReport(null);
    setActivities([]);
    setProgressPercent(5);
    setCurrentPhase('EXTRACT');
    setErrorMessage(null);

    try {
      // Use SSE streaming endpoint for live real-time agent activity
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
                // Avoid duplicate ids
                if (prev.some((a) => a.id === data.id)) return prev;
                return [...prev, data];
              });
            } else if (eventType === 'progress') {
              setCurrentPhase(data.phase);
              setProgressPercent(data.percent);
            } else if (eventType === 'complete') {
              setReport(data);
              setProgressPercent(100);
            } else if (eventType === 'error') {
              setErrorMessage(data.message || 'Evaluation failed.');
            }
          } catch (parseErr) {
            console.warn('[SSE] Parse warning:', parseErr, block);
          }
        }
      }
    } catch (err: any) {
      console.error('[Evaluation] Request failed:', err);
      // Fallback: Attempt standard synchronous endpoint if SSE encounters connection interruptions
      try {
        console.log('[Evaluation] Attempting sync fallback...');
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
          return;
        }
      } catch (syncErr) {
        console.error('[Evaluation] Sync fallback also failed:', syncErr);
      }

      setErrorMessage(err.message || 'An error occurred while evaluating the opportunity.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/80 text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-stone-900">
      {/* Top Navigation */}
      <Header
        activeProfile={activeProfile}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onReset={handleReset}
        isEvaluating={isEvaluating}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-900 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Section: RFP Document Input Box */}
        <OpportunityInput
          opportunityText={opportunityText}
          onChangeText={setOpportunityText}
          onEvaluate={handleEvaluate}
          isEvaluating={isEvaluating}
          activeProfile={activeProfile}
        />

        {/* Middle Section: Live Agent Activity Trail */}
        <AgentActivityTimeline
          activities={activities}
          progressPercent={progressPercent}
          currentPhase={currentPhase}
          isEvaluating={isEvaluating}
        />

        {/* Bottom Section: Decision Banner & Detail Tabs (When report is ready) */}
        {report && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* High-Impact Decision Banner */}
            <DecisionBanner
              report={report}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />

            {/* Deep-Dive Investigation Tabs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2 overflow-x-auto text-xs">
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
                    <span>Evidence-Backed Fit Matrix</span>
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/10 text-[10px]">
                      {report.fitAssessment.strongMatches.length + report.fitAssessment.disqualifiers.length + report.fitAssessment.partialMatches.length + report.fitAssessment.gaps.length}
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
                    <span>Client & Market Diligence</span>
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
                </div>
              </div>

              {/* Tab Views */}
              {activeTab === 'fit' && (
                <FitMatrixView fitAssessment={report.fitAssessment} />
              )}
              {activeTab === 'research' && (
                <ResearchDossierView research={report.research} />
              )}
              {activeTab === 'risk' && (
                <RiskMatrixView riskAssessment={report.riskAssessment} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Profile Modal */}
      <ConsultantProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        activeProfile={activeProfile}
        onSaveProfile={(updated) => setActiveProfile(updated)}
      />

      {/* Export Report Modal */}
      {report && (
        <ExportReportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          report={report}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/80 py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Consultant-in-a-Box</strong> • All Things Agentic Hackathon Project
          </div>
          <div className="flex items-center gap-4 text-stone-400 font-mono text-[11px]">
            <span>Google GenAI SDK (@google/genai)</span>
            <span>•</span>
            <span>Cloud Run / Express Server</span>
            <span>•</span>
            <span>Search Grounding</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
