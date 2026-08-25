import React from 'react';
import { Bot, UserCheck, Sparkles, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { ConsultantProfile } from '../types/agent.ts';

interface HeaderProps {
  activeProfile: ConsultantProfile;
  onOpenProfileModal: () => void;
  onReset: () => void;
  isEvaluating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfile,
  onOpenProfileModal,
  onReset,
  isEvaluating,
}) => {
  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & Agent Architecture badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-sm ring-1 ring-stone-800/20">
            <Bot className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-stone-900 text-lg tracking-tight">
                Consultant-in-a-Box
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Gemini 3.7 + Grounding
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              Multi-Agent RFP Triage & Evidence-Backed Decision Engine
            </p>
          </div>
        </div>

        {/* Right: Active Profile Switcher & Reset Button */}
        <div className="flex items-center gap-3">
          <button
            id="active-profile-button"
            type="button"
            onClick={onOpenProfileModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 transition text-stone-700 text-xs font-medium cursor-pointer shadow-xs"
            title="Click to view or switch consultant profile"
          >
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-left hidden md:block">
              <div className="font-semibold text-stone-800 truncate max-w-[140px]">
                {activeProfile.name}
              </div>
              <div className="text-[10px] text-stone-500 truncate max-w-[140px]">
                ${activeProfile.preferences.minHourlyRateUsd}/hr • {activeProfile.preferences.securityClearance === 'none' ? 'No Clearance' : activeProfile.preferences.securityClearance.toUpperCase()}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">New Analysis</span>
          </button>
        </div>
      </div>
    </header>
  );
};
