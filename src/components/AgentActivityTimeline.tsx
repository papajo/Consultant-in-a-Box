import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  CheckSquare,
  ShieldAlert,
  Bot,
  ChevronDown,
  ChevronUp,
  Cpu,
  Globe,
} from 'lucide-react';
import { AgentActivity } from '../types/agent.ts';

interface AgentActivityTimelineProps {
  activities: AgentActivity[];
  progressPercent: number;
  currentPhase?: string;
  isEvaluating: boolean;
}

export const AgentActivityTimeline: React.FC<AgentActivityTimelineProps> = ({
  activities,
  progressPercent,
  currentPhase,
  isEvaluating,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const getPhaseIcon = (phase: AgentActivity['phase']) => {
    switch (phase) {
      case 'EXTRACT':
        return <CheckSquare className="w-4 h-4 text-sky-500" />;
      case 'RESEARCH':
        return <Globe className="w-4 h-4 text-emerald-500" />;
      case 'FIT_ANALYSIS':
        return <Cpu className="w-4 h-4 text-indigo-500" />;
      case 'RISK_ASSESS':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'DECISION':
      case 'COMPLETE':
        return <Bot className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-stone-500" />;
    }
  };

  const getStatusBadge = (status: AgentActivity['status']) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertCircle className="w-3 h-3" /> Alert
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 animate-pulse">
            <Clock className="w-3 h-3 animate-spin" /> In Progress
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
    }
  };

  return (
    <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 border border-stone-800 shadow-md space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-stone-800 text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Agent Activity & Audit Trail
              </h3>
              {isEvaluating && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400">
              Auditable trace of multi-agent operations, evidence queries, and latency
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-stone-400">
            {activities.length} events logged
          </span>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-stone-400 hover:text-white transition cursor-pointer"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Line */}
      {isEvaluating && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-mono text-stone-300">
            <span>Stage: {currentPhase || 'ORCHESTRATING'}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-400 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Activity Item List */}
      {!isCollapsed && (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs divide-y divide-stone-800/80 font-mono">
          {activities.length === 0 ? (
            <div className="text-center py-6 text-stone-500 text-xs font-sans">
              No active agent run. Click "Run Agentic Triage" to begin evaluation.
            </div>
          ) : (
            activities.map((act) => {
              const isExpanded = expandedId === act.id;
              return (
                <div key={act.id} className="pt-2 first:pt-0 space-y-1">
                  <div
                    onClick={() => act.details && setExpandedId(isExpanded ? null : act.id)}
                    className={`flex items-start justify-between gap-3 p-2 rounded-lg transition ${
                      act.details ? 'cursor-pointer hover:bg-stone-800/70' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 p-1 rounded bg-stone-800 shrink-0">
                        {getPhaseIcon(act.phase)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-amber-400 font-semibold">
                            [{act.timestamp}]
                          </span>
                          <span className="text-stone-300 font-medium font-sans">
                            {act.agentName}
                          </span>
                          {act.latencyMs && (
                            <span className="text-[10px] text-stone-500 font-mono">
                              ({act.latencyMs}ms)
                            </span>
                          )}
                        </div>
                        <p className="text-stone-200 font-sans mt-0.5 leading-relaxed text-xs">
                          {act.action}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {getStatusBadge(act.status)}
                      {act.details && (
                        <button
                          type="button"
                          className="text-stone-400 hover:text-white"
                          title="Toggle details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail box */}
                  {isExpanded && act.details && (
                    <div className="ml-8 p-2.5 rounded bg-stone-950/80 border border-stone-800 text-[11px] text-stone-400 leading-relaxed font-mono">
                      {act.details}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
