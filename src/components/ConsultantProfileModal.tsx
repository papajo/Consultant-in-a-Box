import React, { useState } from 'react';
import { X, User, Briefcase, Award, Shield, DollarSign, MapPin, Check, Save, RotateCcw } from 'lucide-react';
import { ConsultantProfile } from '../types/agent.ts';
import { DEFAULT_PROFILES } from '../data/defaultProfiles.ts';

interface ConsultantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: ConsultantProfile;
  onSaveProfile: (profile: ConsultantProfile) => void;
}

export const ConsultantProfileModal: React.FC<ConsultantProfileModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onSaveProfile,
}) => {
  const [profile, setProfile] = useState<ConsultantProfile>({ ...activeProfile });
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ConsultantProfile) => {
    setProfile({ ...preset });
  };

  const handleSave = () => {
    onSaveProfile(profile);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <User className="w-4 h-4 text-stone-700" />
              Target Consultant Profile
            </h3>
            <p className="text-xs text-stone-500">
              The agent evaluates all RFPs against these skills, rate floors, and constraint preferences.
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

        {/* Preset Selector Bar */}
        <div className="px-6 py-3 border-b border-stone-100 bg-white flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-stone-500 uppercase">
            Switch Preset:
          </span>
          {DEFAULT_PROFILES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                profile.id === p.id
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {p.name} ({p.title.split('/')[0].trim()})
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5 text-xs">
          {/* Name & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-800 text-xs focus:outline-hidden focus:border-stone-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Professional Title
              </label>
              <input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-800 text-xs focus:outline-hidden focus:border-stone-400"
              />
            </div>
          </div>

          {/* Rate & Preferences */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-4">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Commercial & Operational Constraints
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Min Hourly Rate ($/hr)
                </label>
                <input
                  type="number"
                  value={profile.preferences.minHourlyRateUsd}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        minHourlyRateUsd: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-xs focus:outline-hidden focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Max Travel Allowed (%)
                </label>
                <input
                  type="number"
                  value={profile.preferences.maxTravelPercent}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        maxTravelPercent: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-xs focus:outline-hidden focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Security Clearance
                </label>
                <select
                  value={profile.preferences.securityClearance}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        securityClearance: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-xs focus:outline-hidden focus:border-stone-400"
                >
                  <option value="none">None</option>
                  <option value="public_trust">Public Trust</option>
                  <option value="secret">Secret</option>
                  <option value="top_secret">Top Secret / SCI</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remoteOnlyCheck"
                checked={profile.preferences.remoteOnly}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    preferences: {
                      ...profile.preferences,
                      remoteOnly: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-stone-900 border-stone-300 focus:ring-0"
              />
              <label htmlFor="remoteOnlyCheck" className="text-xs text-stone-700 font-medium cursor-pointer">
                Strict Remote Only (RFP requiring on-site presence will be flagged as disqualifiers)
              </label>
            </div>
          </div>

          {/* Primary Skills */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Primary Core Skills (Comma-separated)
            </label>
            <textarea
              rows={2}
              value={profile.primarySkills.join(', ')}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  primarySkills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-800 text-xs focus:outline-hidden focus:border-stone-400"
            />
          </div>

          {/* Certifications */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Certifications Held (Comma-separated)
            </label>
            <textarea
              rows={2}
              value={profile.certifications.join(', ')}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  certifications: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-800 text-xs focus:outline-hidden focus:border-stone-400"
            />
          </div>

          {/* Past Projects Highlight */}
          <div className="space-y-2">
            <label className="block font-semibold text-stone-700">
              Documented Past Projects ({profile.pastProjects.length})
            </label>
            <div className="space-y-2">
              {profile.pastProjects.map((proj, idx) => (
                <div key={proj.id || idx} className="p-3 rounded-lg border border-stone-200 bg-stone-50 text-xs space-y-1">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>{proj.name}</span>
                    <span className="text-stone-500 text-[10px]">{proj.clientIndustry} • {proj.durationMonths} mo</span>
                  </div>
                  <p className="text-stone-600 text-[11px]">{proj.description}</p>
                  <p className="text-emerald-800 font-mono text-[10px]">Outcomes: {proj.outcomes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setProfile({ ...DEFAULT_PROFILES[0] })}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
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
              {savedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedNotice ? 'Profile Applied!' : 'Save & Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
