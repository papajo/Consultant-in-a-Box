import React, { useState } from 'react';
import { X, Sliders, Check, RotateCcw, ShieldCheck, AlertCircle } from 'lucide-react';
import { ScoringWeightsConfig } from '../types/agent.ts';

interface ScoringConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ScoringWeightsConfig;
  onSaveConfig: (config: ScoringWeightsConfig) => void;
}

const DEFAULT_CONFIG: ScoringWeightsConfig = {
  skillsWeight: 35,
  experienceWeight: 25,
  commercialWeight: 20,
  riskTolerance: 'balanced',
  strictDisqualifiers: true,
};

export const ScoringConfigModal: React.FC<ScoringConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<ScoringWeightsConfig>({ ...config });
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-stone-700" />
              Scoring Weights & Risk Policy
            </h3>
            <p className="text-xs text-stone-500">
              Tune how the Decision Engine computes the 0–100 opportunity score.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders & Configuration */}
        <div className="p-6 space-y-5 text-xs">
          {/* Skills Weight Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-stone-800">
                Skills & Tech Stack Fit Weight
              </label>
              <span className="font-mono font-bold text-stone-900">
                {localConfig.skillsWeight}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={localConfig.skillsWeight}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, skillsWeight: parseInt(e.target.value) })
              }
              className="w-full accent-stone-900 cursor-pointer"
            />
            <p className="text-[11px] text-stone-500">
              Weight given to primary and secondary technical skills matching the RFP.
            </p>
          </div>

          {/* Experience Weight Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-stone-800">
                Past Projects & Domain Track Record Weight
              </label>
              <span className="font-mono font-bold text-stone-900">
                {localConfig.experienceWeight}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={localConfig.experienceWeight}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, experienceWeight: parseInt(e.target.value) })
              }
              className="w-full accent-stone-900 cursor-pointer"
            />
            <p className="text-[11px] text-stone-500">
              Weight given to documented case studies and measured production outcomes.
            </p>
          </div>

          {/* Commercial Fit Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-stone-800">
                Commercial Attractiveness & Rate Floor Weight
              </label>
              <span className="font-mono font-bold text-stone-900">
                {localConfig.commercialWeight}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={40}
              step={5}
              value={localConfig.commercialWeight}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, commercialWeight: parseInt(e.target.value) })
              }
              className="w-full accent-stone-900 cursor-pointer"
            />
            <p className="text-[11px] text-stone-500">
              Weight given to budget alignment and hourly rate feasibility.
            </p>
          </div>

          {/* Risk Tolerance */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <label className="block font-semibold text-stone-800">
              Risk Tolerance Model
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['conservative', 'balanced', 'aggressive'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLocalConfig({ ...localConfig, riskTolerance: mode })}
                  className={`p-2.5 rounded-xl border text-center font-semibold capitalize cursor-pointer transition ${
                    localConfig.riskTolerance === mode
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Strict Disqualifiers Check */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200">
            <input
              type="checkbox"
              id="strict-disq"
              checked={localConfig.strictDisqualifiers}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, strictDisqualifiers: e.target.checked })
              }
              className="w-4 h-4 rounded text-stone-900 border-stone-300 focus:ring-0 mt-0.5 cursor-pointer"
            />
            <div>
              <label htmlFor="strict-disq" className="font-semibold text-stone-900 cursor-pointer">
                Strict Disqualifier Enforcement
              </label>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Automatically triggers an immediate PASS verdict when mandatory hard requirements (clearance, on-site travel, rate floor) fail.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setLocalConfig({ ...DEFAULT_CONFIG })}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
              <span>{saved ? 'Saved!' : 'Save Weights'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
