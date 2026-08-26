import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Download,
  Send,
  ShieldCheck,
  Award,
  DollarSign,
  Mail,
  HelpCircle,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { OpportunityEvaluationReport, GeneratedProposal } from '../types/agent.ts';

interface ProposalGeneratorViewProps {
  report: OpportunityEvaluationReport;
}

export const ProposalGeneratorView: React.FC<ProposalGeneratorViewProps> = ({ report }) => {
  const [customFocus, setCustomFocus] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [proposal, setProposal] = useState<GeneratedProposal | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    'pitch' | 'soq' | 'requirements' | 'risk_plan' | 'commercial' | 'email'
  >('pitch');

  const handleGenerate = async (focusText?: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report,
          customFocus: focusText !== undefined ? focusText : customFocus,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data: GeneratedProposal = await response.json();
      setProposal(data);
    } catch (err: any) {
      console.error('[ProposalGenerator] Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getFullMarkdown = (): string => {
    if (!proposal) return '';
    const prof = report.consultantProfileSnapshot;
    return `# PROPOSAL & CAPABILITY STATEMENT
**Opportunity:** ${report.opportunityTitle}
**Client:** ${report.clientName}
**Prepared by:** ${prof.name} (${prof.title})
**Date:** ${new Date().toLocaleDateString()}

---

## 1. EXECUTIVE PITCH
${proposal.executivePitch}

---

## 2. STATEMENT OF QUALIFICATIONS
${proposal.statementOfQualifications}

---

## 3. REQUIREMENTS & CAPABILITY EVIDENCE MAPPING
${proposal.requirementResponses
  .map(
    (r, i) => `### Requirement ${i + 1}: ${r.requirement}
**Capability Response:** ${r.capabilityEvidence}
**Documented Citation:** ${r.pastProjectCitation}
`
  )
  .join('\n')}

---

## 4. PROACTIVE RISK MITIGATION PLAN
${proposal.riskMitigationPlan}

---

## 5. PROPOSED COMMERCIAL TERMS & ENGAGEMENT MODEL
${proposal.proposedCommercialTerms}

---

## 6. CLIENT DISCOVERY & CLARIFICATION EMAIL
${proposal.clientClarificationEmail}
`;
  };

  const handleDownloadMarkdown = () => {
    const md = getFullMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Proposal-${report.clientName.replace(/\s+/g, '-')}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Tailored Proposal & Pitch Package Generator
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Evidence-Grounded
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Autonomously creates customized client proposals, mapped requirement proof statements, and discovery emails.
          </p>
        </div>

        {proposal && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(getFullMarkdown(), 'full_doc')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer transition"
            >
              {copiedSection === 'full_doc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Full Proposal</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>
          </div>
        )}
      </div>

      {/* Strategic Focus Input & Trigger */}
      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
            Strategic Positioning Angle (Optional Customization)
          </label>
          <span className="text-[11px] text-stone-400">
            e.g., &quot;Emphasize fast-track zero downtime migration&quot;
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={customFocus}
            onChange={(e) => setCustomFocus(e.target.value)}
            placeholder="Focus angle (e.g. Lead with AI reliability, highlight Fortune 500 compliance, or propose phased milestone spikes)..."
            className="flex-1 px-3 py-2 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400"
          />
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Package...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>{proposal ? 'Regenerate Proposal' : 'Generate Full Proposal Package'}</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-stone-500 font-medium">Quick Angles:</span>
          {[
            'Emphasize high ROI & zero-downtime execution',
            'Lead with production LLM security & data governance',
            'Propose fixed Sprint 1 architectural spike with T&M continuation',
          ].map((angle, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCustomFocus(angle);
                handleGenerate(angle);
              }}
              className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-stone-200 border border-stone-200 text-stone-700 font-medium cursor-pointer transition"
            >
              + {angle}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Content Sections */}
      {proposal ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Section Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('pitch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer border ${
                activeSubTab === 'pitch'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Executive Pitch
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('soq')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer border ${
                activeSubTab === 'soq'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Qualifications Statement
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('requirements')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer border ${
                activeSubTab === 'requirements'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Requirement Proofs ({proposal.requirementResponses.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('risk_plan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer border ${
                activeSubTab === 'risk_plan'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" /> Risk Defense Plan
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('commercial')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer border ${
                activeSubTab === 'commercial'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Commercial Terms
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer border ${
                activeSubTab === 'email'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Pre-Bid Discovery Email
            </button>
          </div>

          {/* Section 1: Executive Pitch */}
          {activeSubTab === 'pitch' && (
            <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Executive Pitch Statement
                </h4>
                <button
                  type="button"
                  onClick={() => copyToClipboard(proposal.executivePitch, 'pitch')}
                  className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  {copiedSection === 'pitch' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'pitch' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-4 rounded-lg bg-white border border-stone-200/80 text-xs text-stone-800 leading-relaxed whitespace-pre-wrap font-serif text-[13px]">
                {proposal.executivePitch}
              </div>
            </div>
          )}

          {/* Section 2: Statement of Qualifications */}
          {activeSubTab === 'soq' && (
            <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Statement of Qualifications & Domain Depth
                </h4>
                <button
                  type="button"
                  onClick={() => copyToClipboard(proposal.statementOfQualifications, 'soq')}
                  className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  {copiedSection === 'soq' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'soq' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-4 rounded-lg bg-white border border-stone-200/80 text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">
                {proposal.statementOfQualifications}
              </div>
            </div>
          )}

          {/* Section 3: Requirement Capability Proofs */}
          {activeSubTab === 'requirements' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Direct Requirement-to-Capability Proof Mapping
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      proposal.requirementResponses
                        .map((r) => `Req: ${r.requirement}\nProof: ${r.capabilityEvidence}\nProject: ${r.pastProjectCitation}`)
                        .join('\n\n'),
                      'reqs'
                    )
                  }
                  className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  {copiedSection === 'reqs' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'reqs' ? 'Copied' : 'Copy All Proofs'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {proposal.requirementResponses.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-stone-900 text-white font-mono text-[10px] font-bold">
                        REQ #{idx + 1}
                      </span>
                      <strong className="text-stone-900">{item.requirement}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-stone-200/80 text-stone-800 leading-relaxed">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase mb-1">
                        Capability Proof
                      </div>
                      {item.capabilityEvidence}
                    </div>
                    {item.pastProjectCitation && (
                      <div className="text-[11px] font-mono text-stone-600 bg-stone-100 px-2.5 py-1 rounded">
                        <strong>Citation:</strong> {item.pastProjectCitation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Risk Defense Plan */}
          {activeSubTab === 'risk_plan' && (
            <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Proactive Risk Mitigation Strategy
                </h4>
                <button
                  type="button"
                  onClick={() => copyToClipboard(proposal.riskMitigationPlan, 'risk')}
                  className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  {copiedSection === 'risk' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'risk' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-4 rounded-lg bg-white border border-stone-200/80 text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">
                {proposal.riskMitigationPlan}
              </div>
            </div>
          )}

          {/* Section 5: Commercial Terms */}
          {activeSubTab === 'commercial' && (
            <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Commercial Terms & Proposed Engagement Structure
                </h4>
                <button
                  type="button"
                  onClick={() => copyToClipboard(proposal.proposedCommercialTerms, 'commercial')}
                  className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  {copiedSection === 'commercial' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'commercial' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-4 rounded-lg bg-white border border-stone-200/80 text-xs text-stone-800 font-mono leading-relaxed whitespace-pre-wrap">
                {proposal.proposedCommercialTerms}
              </div>
            </div>
          )}

          {/* Section 6: Pre-Bid Discovery Email */}
          {activeSubTab === 'email' && (
            <div className="p-5 rounded-xl bg-stone-900 text-stone-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                    Ready-to-Send Client Discovery & Inquiry Email
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(proposal.clientClarificationEmail, 'email')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-xs text-stone-200 cursor-pointer transition"
                >
                  {copiedSection === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'email' ? 'Copied' : 'Copy Email'}</span>
                </button>
              </div>
              <div className="p-4 rounded-lg bg-stone-800 border border-stone-700 text-xs text-stone-200 leading-relaxed whitespace-pre-wrap font-mono">
                {proposal.clientClarificationEmail}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center rounded-xl bg-stone-50 border border-dashed border-stone-200 text-stone-500 space-y-2">
          <FileText className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-xs font-medium text-stone-700">
            Click &quot;Generate Full Proposal Package&quot; above to create a bespoke capability statement and pitch.
          </p>
          <p className="text-[11px] text-stone-400">
            Uses Gemini 3.7 to craft an executive pitch, requirement response proofs, and ready-to-send discovery email.
          </p>
        </div>
      )}
    </div>
  );
};
