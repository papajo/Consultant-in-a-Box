import React from 'react';
import {
  Bot,
  UserCheck,
  Sparkles,
  RefreshCw,
  Layers,
  ShieldCheck,
  Briefcase,
  Sliders,
  MessageSquare,
  FileCheck2,
} from 'lucide-react';
import { ConsultantProfile } from '../types/agent.ts';

interface HeaderProps {
  activeProfile: ConsultantProfile;
  currentView: 'triage' | 'pipeline' | 'compare';
  onChangeView: (view: 'triage' | 'pipeline' | 'compare') => void;
  pipelineCount: number;
  onOpenProfileModal: () => void;
  onOpenScoringModal: () => void;
  onOpenCopilot?: () => void;
  hasActiveReport: boolean;
  onReset: () => void;
  isEvaluating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfile,
  currentView,
  onChangeView,
  pipelineCount,
  onOpenProfileModal,
  onOpenScoringModal,
  onOpenCopilot,
  hasActiveReport,
  onReset,
  isEvaluating,
}) => {
  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onChangeView('triage')}
            className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-sm ring-1 ring-stone-800/20 cursor-pointer"
          >
            <Bot className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                onClick={() => onChangeView('triage')}
                className="font-bold text-stone-900 text-lg tracking-tight cursor-pointer"
              >
                Consultant-in-a-Box
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Gemini 3.7 + Grounding
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden md:block">
              Multi-Agent RFP Triage, Diligence & Proposal Decision Engine
            </p>
          </div>
        </div>

        {/* Center: Main View Switcher Navigation */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs">
          <button
            type="button"
            onClick={() => onChangeView('triage')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              currentView === 'triage'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Triage Hub</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeView('pipeline')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              currentView === 'pipeline'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Pipeline CRM</span>
            {pipelineCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-[10px] font-mono">
                {pipelineCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onChangeView('compare')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              currentView === 'compare'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Comparison Matrix</span>
          </button>
        </div>

        {/* Right: Controls, Profile & Copilot */}
        <div className="flex items-center gap-2">
          {/* AI Copilot Button if active report exists */}
          {hasActiveReport && onOpenCopilot && (
            <button
              type="button"
              onClick={onOpenCopilot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition cursor-pointer shadow-xs animate-pulse"
              title="Chat with Strategic Opportunity Copilot"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden md:inline">Ask Copilot</span>
            </button>
          )}

          {/* Scoring Weights Config Button */}
          <button
            type="button"
            onClick={onOpenScoringModal}
            className="p-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs transition cursor-pointer"
            title="Configure scoring weights and risk policy"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Consultant Profile Switcher */}
          <button
            id="active-profile-button"
            type="button"
            onClick={onOpenProfileModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 transition text-stone-700 text-xs font-medium cursor-pointer shadow-xs"
            title="Click to view or switch consultant profile"
          >
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-left hidden lg:block">
              <div className="font-semibold text-stone-800 truncate max-w-[130px]">
                {activeProfile.name}
              </div>
              <div className="text-[10px] text-stone-500 truncate max-w-[130px]">
                ${activeProfile.preferences.minHourlyRateUsd}/hr • {activeProfile.preferences.securityClearance.toUpperCase()}
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-stone-200 text-[10px] text-stone-700 font-semibold uppercase">
              Profile
            </span>
          </button>

          <button
            id="reset-analysis-button"
            type="button"
            onClick={onReset}
            disabled={isEvaluating}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset active analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>
    </header>
  );
};

