import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Code } from 'lucide-react';
import { OpportunityEvaluationReport } from '../types/agent.ts';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: OpportunityEvaluationReport;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = (): string => {
    const { recommendation, extraction, fitAssessment, riskAssessment, research, consultantProfileSnapshot } = report;
    return `# CONSULTANT-IN-A-BOX: OPPORTUNITY TRIAGE REPORT
**Date:** ${new Date(report.timestamp).toLocaleString()}
**Opportunity:** ${report.opportunityTitle}
**Client:** ${report.clientName}
**Consultant Evaluated:** ${consultantProfileSnapshot.name} (${consultantProfileSnapshot.title})

---

## 1. EXECUTIVE DECISION
- **RECOMMENDATION:** **${recommendation.decision}**
- **Opportunity Score:** **${recommendation.opportunityScore} / 100**
- **Confidence Level:** ${recommendation.confidence}
- **Headline:** ${recommendation.headline}

### Executive Rationale
${recommendation.executiveSummary}

### Score Breakdown
- Skills Fit: ${recommendation.scoreBreakdown.skillsFitScore} / 100
- Experience Fit: ${recommendation.scoreBreakdown.experienceFitScore} / 100
- Commercial Fit: ${recommendation.scoreBreakdown.commercialFitScore} / 100
- Risk Adjustment Penalty: -${Math.round(recommendation.scoreBreakdown.riskAdjustment)} points

---

## 2. KEY HIGHLIGHTS
### Strengths
${recommendation.keyStrengths.map(s => `- ${s}`).join('\n')}

### Gaps & Dealbreakers
${recommendation.dealBreakers.length > 0 ? recommendation.dealBreakers.map(db => `- [FATAL DISQUALIFIER] ${db}`).join('\n') : (recommendation.criticalGaps.length > 0 ? recommendation.criticalGaps.map(g => `- [GAP] ${g}`).join('\n') : '- None identified.')}

### Primary Risks
${recommendation.primaryRisks.map(r => `- ${r}`).join('\n')}

### Next Steps
${recommendation.suggestedNextSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

---

## 3. EVIDENCE-BACKED FIT MATRIX
| Requirement | Mandatory | Match Status | Profile Evidence Citation |
| :--- | :--- | :--- | :--- |
${[...fitAssessment.disqualifiers, ...fitAssessment.strongMatches, ...fitAssessment.partialMatches, ...fitAssessment.gaps, ...fitAssessment.unverified]
  .map(m => `| ${m.requirementText.replace(/\|/g, '-')} | ${m.mandatory ? 'YES' : 'NO'} | ${m.matchStatus.toUpperCase()} | ${m.profileEvidence.replace(/\|/g, '-')} |`)
  .join('\n')}

---

## 4. CLIENT DILIGENCE & GROUNDING
- **Client Overview:** ${research.clientOverview}
- **Industry Standing:** ${research.industryReputation}
- **Tech Stack:** ${research.techStackInsights.join(', ')}

---

## 5. PRIORITY CLIENT CLARIFICATION QUESTIONS
${riskAssessment.clarificationQuestionsForClient.map((q, idx) => `Q${idx + 1}: ${q}`).join('\n')}

---
*Generated autonomously by Consultant-in-a-Box agentic triage system.*
`;
  };

  const getExportText = () => {
    if (format === 'markdown') {
      return generateMarkdown();
    }
    return JSON.stringify(report, null, 2);
  };

  const exportText = getExportText();

  const handleCopy = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `consultant-triage-${report.clientName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${format === 'markdown' ? 'md' : 'json'}`;
    const blob = new Blob([exportText], { type: format === 'markdown' ? 'text/markdown' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-700" />
              Export Diligence Report
            </h3>
            <p className="text-xs text-stone-500">
              Download or copy full structured assessment for client records or team review.
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

        {/* Format Selector Bar */}
        <div className="px-6 py-3 border-b border-stone-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFormat('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                format === 'markdown'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Markdown (.md)
            </button>
            <button
              type="button"
              onClick={() => setFormat('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                format === 'json'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> Raw JSON Schema
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-6 overflow-y-auto bg-stone-950 text-stone-200 font-mono text-xs leading-relaxed max-h-[50vh]">
          <pre className="whitespace-pre-wrap">{exportText}</pre>
        </div>
      </div>
    </div>
  );
};
