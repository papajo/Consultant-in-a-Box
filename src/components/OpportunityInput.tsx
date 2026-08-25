import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Play, CheckCircle2, AlertTriangle, XCircle, ArrowRight, FileCheck } from 'lucide-react';
import { SAMPLE_RFPS, SampleRFP } from '../data/sampleRFPs.ts';
import { ConsultantProfile } from '../types/agent.ts';

interface OpportunityInputProps {
  opportunityText: string;
  onChangeText: (text: string) => void;
  onEvaluate: () => void;
  isEvaluating: boolean;
  activeProfile: ConsultantProfile;
}

export const OpportunityInput: React.FC<OpportunityInputProps> = ({
  opportunityText,
  onChangeText,
  onEvaluate,
  isEvaluating,
  activeProfile,
}) => {
  const [selectedSampleId, setSelectedSampleId] = useState<string>('rfp-apex-ai-go');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectSample = (sample: SampleRFP) => {
    setSelectedSampleId(sample.id);
    onChangeText(sample.content);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readFile(e.target.files[0]);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onChangeText(content);
        setSelectedSampleId('');
      }
    };
    reader.readAsText(file);
  };

  const wordCount = opportunityText.trim() ? opportunityText.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
      {/* Top row: Section title and quick demo sample pills */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-700" />
              Opportunity / RFP Document
            </h2>
            <p className="text-xs text-stone-500">
              Paste RFP description, job posting, contract statement of work, or load a sample scenario.
            </p>
          </div>

          <div className="text-xs text-stone-500 font-mono bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200">
            Evaluating as: <strong className="text-stone-800">{activeProfile.name}</strong>
          </div>
        </div>

        {/* Quick Sample Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Quick Test RFPs:
          </span>
          {SAMPLE_RFPS.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                id={`sample-rfp-${sample.id}`}
                onClick={() => handleSelectSample(sample)}
                disabled={isEvaluating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs ring-1 ring-stone-900/10'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                }`}
              >
                {sample.expectedOutcome === 'GO' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {sample.expectedOutcome === 'PASS' && (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                {sample.expectedOutcome === 'REVIEW' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{sample.clientName}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-black/20 text-stone-300 uppercase">
                  {sample.expectedOutcome}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Textarea & Drag Drop Target */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        className={`relative rounded-xl border-2 transition-all ${
          isDragging
            ? 'border-amber-500 bg-amber-50/40'
            : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
        }`}
      >
        <textarea
          id="opportunity-text-input"
          value={opportunityText}
          onChange={(e) => {
            onChangeText(e.target.value);
            if (selectedSampleId) setSelectedSampleId('');
          }}
          disabled={isEvaluating}
          placeholder="Paste RFP contents, technical job description, contract scope of work, budget specifications, and requirements here..."
          className="w-full h-72 p-4 text-xs font-mono text-stone-800 bg-transparent resize-y focus:outline-hidden focus:ring-0 leading-relaxed placeholder:text-stone-400"
        />

        {/* Footer info bar inside textarea container */}
        <div className="px-4 py-2 border-t border-stone-200/80 bg-white/70 rounded-b-xl flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{opportunityText.length} characters</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".txt,.md,.json,.rtf"
              className="hidden"
              id="file-upload-input"
            />
            <button
              type="button"
              id="upload-file-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isEvaluating}
              className="flex items-center gap-1 text-stone-600 hover:text-stone-900 transition font-medium cursor-pointer text-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Document (.txt, .md)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action CTA Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-stone-500 leading-normal">
          Autonomous multi-stage pipeline: <span className="font-semibold text-stone-700">Extract Requirements</span> → <span className="font-semibold text-stone-700">Client Grounding</span> → <span className="font-semibold text-stone-700">Fit Evidence</span> → <span className="font-semibold text-stone-700">Risk Matrix</span> → <span className="font-semibold text-stone-700">Decision</span>
        </div>

        <button
          id="evaluate-opportunity-button"
          type="button"
          onClick={onEvaluate}
          disabled={isEvaluating || !opportunityText.trim()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group ring-1 ring-stone-900/10"
        >
          {isEvaluating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Agents Investigating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-amber-400 text-amber-400 transition-transform group-hover:scale-110" />
              <span>Run Agentic Triage</span>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
