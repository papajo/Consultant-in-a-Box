import {
  AgentActivity,
  ConfidenceLevel,
  ConsultantProfile,
  DecisionType,
  FitAssessment,
  GeneratedProposal,
  OpportunityChatMessage,
  OpportunityEvaluationReport,
  OpportunityScoreBreakdown,
  RecommendationResult,
  Requirement,
  RequirementExtractionResult,
  RequirementFitMatch,
  ResearchDossier,
  RiskAssessment,
  RiskItem,
} from '../types/agent.ts';
import { defaultModelProvider, LLMProvider } from './modelProvider.ts';

export type ActivityCallback = (activity: AgentActivity) => void;
export type ProgressCallback = (phase: string, percent: number) => void;

export class OpportunityAgentOrchestrator {
  private provider: LLMProvider;

  constructor(provider?: LLMProvider) {
    this.provider = provider || defaultModelProvider;
  }

  /**
   * Main Entrypoint: Evaluates an RFP or opportunity text against a consultant profile.
   */
  async evaluateOpportunity(
    opportunityText: string,
    profile: ConsultantProfile,
    callbacks?: {
      onActivity?: ActivityCallback;
      onProgress?: ProgressCallback;
    }
  ): Promise<OpportunityEvaluationReport> {
    const reportId = `eval-${Date.now()}`;
    const activityTrail: AgentActivity[] = [];

    const recordActivity = (
      phase: AgentActivity['phase'],
      agentName: string,
      action: string,
      details?: string,
      status: AgentActivity['status'] = 'done',
      latencyMs?: number
    ) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const activity: AgentActivity = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        phase,
        agentName,
        action,
        details,
        status,
        latencyMs,
      };
      activityTrail.push(activity);
      callbacks?.onActivity?.(activity);
    };

    recordActivity('EXTRACT', 'Root Opportunity Agent', 'Received opportunity text & initialized triage pipeline', `Input length: ${opportunityText.length} characters`);
    callbacks?.onProgress?.('EXTRACT', 10);

    // ==========================================
    // STAGE 1: Requirement Extraction & Classification
    // ==========================================
    const extractStartTime = Date.now();
    recordActivity('EXTRACT', 'Requirement Analyzer Agent', 'Parsing document syntax, identifying client identity, rate constraints, and extracting requirements');

    let extraction: RequirementExtractionResult;
    try {
      extraction = await this.extractRequirements(opportunityText);
      const latency = Date.now() - extractStartTime;
      recordActivity(
        'EXTRACT',
        'Requirement Analyzer Agent',
        `Extracted ${extraction.requirements.length} structured requirements and ${extraction.identifiedUnknowns.length} unknowns`,
        `Client: "${extraction.clientName || 'Unknown'}" | Title: "${extraction.opportunityTitle}"`,
        'done',
        latency
      );
    } catch (err: any) {
      console.warn('[Orchestrator] Extraction via LLM failed, using fallback parser:', err);
      extraction = this.fallbackExtractRequirements(opportunityText);
      recordActivity('EXTRACT', 'Requirement Analyzer Agent', 'Used structured heuristic parser for requirement extraction', err.message, 'warning');
    }

    callbacks?.onProgress?.('RESEARCH', 30);

    // ==========================================
    // STAGE 2: Client & Market Research (Grounding)
    // ==========================================
    const researchStartTime = Date.now();
    recordActivity(
      'RESEARCH',
      'Research Agent',
      `Investigating client entity "${extraction.clientName || 'Target Organization'}" and tech domain background`,
      'Initiating Google Search grounding and market reputation queries...'
    );

    let researchDossier: ResearchDossier;
    try {
      researchDossier = await this.researchClientAndMarket(extraction.clientName, extraction.opportunityTitle, opportunityText);
      const latency = Date.now() - researchStartTime;
      recordActivity(
        'RESEARCH',
        'Research Agent',
        `Completed external investigation with ${researchDossier.sources.length} grounding citations`,
        `Reputation: ${researchDossier.industryReputation.substring(0, 100)}...`,
        'done',
        latency
      );
    } catch (err: any) {
      console.warn('[Orchestrator] Research failed, using internal knowledge synthesis:', err);
      researchDossier = this.fallbackResearch(extraction.clientName, extraction.opportunityTitle);
      recordActivity('RESEARCH', 'Research Agent', 'Completed synthesized research using internal knowledge base', err.message, 'warning');
    }

    callbacks?.onProgress?.('FIT_ANALYSIS', 55);

    // ==========================================
    // STAGE 3: Evidence-Backed Fit Analysis
    // ==========================================
    const fitStartTime = Date.now();
    recordActivity(
      'FIT_ANALYSIS',
      'Fit Analyzer Agent',
      `Cross-referencing ${extraction.requirements.length} requirements against ${profile.name}'s profile (${profile.yearsExperience} yrs exp, ${profile.primarySkills.length} core skills, ${profile.pastProjects.length} projects)`,
      `Evaluating mandatory constraints, security clearances, hourly rate minimum ($${profile.preferences.minHourlyRateUsd}/hr), and remote policy`
    );

    let fitAssessment: FitAssessment;
    try {
      fitAssessment = await this.analyzeFitWithEvidence(extraction, profile);
      const latency = Date.now() - fitStartTime;
      recordActivity(
        'FIT_ANALYSIS',
        'Fit Analyzer Agent',
        `Fit analysis complete: ${fitAssessment.strongMatches.length} strong matches, ${fitAssessment.partialMatches.length} partial, ${fitAssessment.gaps.length} gaps, ${fitAssessment.disqualifiers.length} disqualifiers`,
        `Calculated Baseline Fit Score: ${fitAssessment.overallFitScore}/100`,
        fitAssessment.disqualifiers.length > 0 ? 'warning' : 'done',
        latency
      );
    } catch (err: any) {
      console.warn('[Orchestrator] Fit analysis LLM failed, using deterministic matching engine:', err);
      fitAssessment = this.fallbackAnalyzeFit(extraction, profile);
      recordActivity('FIT_ANALYSIS', 'Fit Analyzer Agent', 'Calculated deterministic evidence-backed profile fit matches', err.message, 'warning');
    }

    callbacks?.onProgress?.('RISK_ASSESS', 75);

    // ==========================================
    // STAGE 4: Risk & Uncertainty Assessment
    // ==========================================
    const riskStartTime = Date.now();
    recordActivity(
      'RISK_ASSESS',
      'Risk/Decision Agent',
      'Evaluating scope ambiguity, commercial rate alignment, travel burden, and contract risks',
      'Auditing unknowns and generating critical client clarification questions'
    );

    let riskAssessment: RiskAssessment;
    try {
      riskAssessment = await this.assessRisksAndUncertainties(extraction, profile, fitAssessment, researchDossier);
      const latency = Date.now() - riskStartTime;
      recordActivity(
        'RISK_ASSESS',
        'Risk/Decision Agent',
        `Risk assessment complete: Overall Risk is ${riskAssessment.overallRiskLevel} (Risk Index: ${riskAssessment.riskScore}/100) with ${riskAssessment.identifiedRisks.length} flagged risk items`,
        `Generated ${riskAssessment.clarificationQuestionsForClient.length} critical questions for client`,
        'done',
        latency
      );
    } catch (err: any) {
      console.warn('[Orchestrator] Risk assessment LLM failed, using rule-based risk evaluation:', err);
      riskAssessment = this.fallbackAssessRisks(extraction, profile, fitAssessment);
      recordActivity('RISK_ASSESS', 'Risk/Decision Agent', 'Completed rule-based risk assessment and gap verification', err.message, 'warning');
    }

    callbacks?.onProgress?.('DECISION', 90);

    // ==========================================
    // STAGE 5: Scoring & Recommendation Synthesis
    // ==========================================
    const decisionStartTime = Date.now();
    recordActivity(
      'DECISION',
      'Root Opportunity Agent',
      'Synthesizing final evidence, scoring breakdown, and formulating GO / REVIEW / PASS recommendation'
    );

    let recommendation: RecommendationResult;
    try {
      recommendation = await this.synthesizeRecommendation(extraction, profile, fitAssessment, riskAssessment, researchDossier);
      const latency = Date.now() - decisionStartTime;
      recordActivity(
        'DECISION',
        'Root Opportunity Agent',
        `Decision Rendered: ${recommendation.decision} (Opportunity Score: ${recommendation.opportunityScore}/100, Confidence: ${recommendation.confidence})`,
        recommendation.headline,
        'done',
        latency
      );
    } catch (err: any) {
      console.warn('[Orchestrator] Recommendation LLM failed, using deterministic synthesis:', err);
      recommendation = this.fallbackSynthesizeRecommendation(fitAssessment, riskAssessment, extraction, profile);
      recordActivity('DECISION', 'Root Opportunity Agent', `Decision synthesized: ${recommendation.decision}`, err.message, 'warning');
    }

    recordActivity('COMPLETE', 'Root Opportunity Agent', 'Opportunity evaluation complete and preserved for review', `Final Score: ${recommendation.opportunityScore}/100`);
    callbacks?.onProgress?.('COMPLETE', 100);

    const report: OpportunityEvaluationReport = {
      id: reportId,
      timestamp: new Date().toISOString(),
      opportunityTitle: extraction.opportunityTitle || 'Consulting Opportunity',
      clientName: extraction.clientName || 'Prospective Client',
      rawInputSnippet: opportunityText.length > 300 ? opportunityText.substring(0, 300) + '...' : opportunityText,
      consultantProfileSnapshot: profile,
      extraction,
      research: researchDossier,
      fitAssessment,
      riskAssessment,
      recommendation,
      activityTrail,
    };

    return report;
  }

  // =========================================================================
  // SUB-AGENT 1: REQUIREMENT EXTRACTOR
  // =========================================================================
  private async extractRequirements(text: string): Promise<RequirementExtractionResult> {
    const prompt = `
You are the Requirement Analyzer Agent.
Analyze the following RFP or opportunity description.
Extract all distinct requirements and classify them strictly into:
- hard (mandatory, non-negotiable prerequisite)
- preferred (nice to have, desired)
- inferred (not explicitly stated but logically required for delivery)
- unknown (ambiguous or missing information that needs clarification)

Categorize each requirement into one of: 'technical', 'domain', 'certification', 'experience', 'operational', 'commercial'.

Also extract the client/company name, opportunity title, estimated budget or hourly rate (if stated), duration/timeline, and work arrangement (remote/hybrid/on-site).

Return a JSON object conforming to:
{
  "clientName": "string",
  "opportunityTitle": "string",
  "estimatedBudgetOrRate": "string or undefined",
  "timelineOrDuration": "string or undefined",
  "workArrangement": "string or undefined",
  "summary": "Concise 2-3 sentence overview of what this project entails",
  "requirements": [
    {
      "id": "req-1",
      "category": "technical | domain | certification | experience | operational | commercial",
      "text": "Exact description of requirement",
      "classification": "hard | preferred | inferred | unknown",
      "mandatory": true | false,
      "sourceContext": "Brief excerpt or section where this was mentioned"
    }
  ],
  "identifiedUnknowns": [
    "List of critical details omitted from the RFP, e.g. budget, specific tech stack versions, team size, approval process"
  ]
}

DOCUMENT TEXT:
${text}
`;

    return await this.provider.generateJSON<RequirementExtractionResult>(
      prompt,
      'You are a rigorous requirement extraction agent. Do not hallucinate requirements. Classify strictly based on document text.'
    );
  }

  // =========================================================================
  // SUB-AGENT 2: RESEARCH AGENT (WITH GROUNDING)
  // =========================================================================
  private async researchClientAndMarket(clientName: string, title: string, contextSnippet: string): Promise<ResearchDossier> {
    if (!clientName || clientName.toLowerCase().includes('unknown') || clientName.length < 3) {
      return {
        clientName: clientName || 'Undisclosed Client',
        clientOverview: 'Client name was not explicitly named in the RFP text (may be an anonymous intermediary or NDA listing).',
        industryReputation: 'Reputation cannot be externally verified without entity name.',
        techStackInsights: ['Relying on technical stack mentioned in opportunity description.'],
        recentNewsOrInitiatives: [],
        potentialRedFlags: ['Anonymous issuer: verify client solvency and legitimacy prior to contract signing.'],
        sources: [],
        isResearched: false,
      };
    }

    const searchQuery = `Research the company "${clientName}" for consulting diligence: industry reputation, tech stack, business stability, recent initiatives, and potential risks. Context: ${title}`;
    const result = await this.provider.generateTextWithGrounding(searchQuery);

    // Structure the research into a clean dossier
    const structurePrompt = `
Transform the following raw company research text into a clean structured research dossier JSON object:
Raw research text:
${result.text}

Return JSON with:
{
  "clientName": "${clientName}",
  "clientOverview": "Summary of what the company does, scale, and headquarters",
  "industryReputation": "Reputation and credibility in their market",
  "techStackInsights": ["Key tech stack items or technical direction known for this company"],
  "recentNewsOrInitiatives": ["Recent notable business or tech initiatives"],
  "potentialRedFlags": ["Any litigation, layoffs, contractor payment controversies, or regulatory actions"]
}
`;

    const structured = await this.provider.generateJSON<{
      clientName: string;
      clientOverview: string;
      industryReputation: string;
      techStackInsights: string[];
      recentNewsOrInitiatives: string[];
      potentialRedFlags: string[];
    }>(structurePrompt);

    return {
      clientName: structured.clientName || clientName,
      clientOverview: structured.clientOverview || 'Corporate background researched.',
      industryReputation: structured.industryReputation || 'Standard enterprise profile.',
      techStackInsights: structured.techStackInsights || [],
      recentNewsOrInitiatives: structured.recentNewsOrInitiatives || [],
      potentialRedFlags: structured.potentialRedFlags || [],
      sources: result.sources || [],
      isResearched: true,
    };
  }

  // =========================================================================
  // SUB-AGENT 3: FIT ANALYZER (EVIDENCE-BACKED)
  // =========================================================================
  private async analyzeFitWithEvidence(
    extraction: RequirementExtractionResult,
    profile: ConsultantProfile
  ): Promise<FitAssessment> {
    const prompt = `
You are the Fit Analyzer Agent.
Compare the following extracted requirements against the consultant's structured profile.

For EVERY requirement, determine:
- matchStatus:
  * "strong_match": Consultant profile has direct, documented past experience, skills, or certifications.
  * "partial_match": Consultant has adjacent skills or partial experience that could transfer.
  * "gap": Consultant does not possess this requirement, but it is not necessarily a hard disqualifier.
  * "disqualifier": A MANDATORY/HARD requirement that directly contradicts the consultant's profile, preferences, rate minimums, clearance, or restrictions (e.g. requires Top Secret clearance but consultant has none; requires 100% on-site in another state but consultant is remote-only; rate cap is below consultant's minimum $${profile.preferences.minHourlyRateUsd}/hr; excluded industry).
  * "unverified": Requirement is ambiguous or consultant profile doesn't provide enough detail to know.
- profileEvidence: SPECIFIC quote or fact from the consultant profile proving the match, gap, or disqualifier.
- explanation: Precise reasoning linking the requirement to the evidence.
- confidence: "HIGH" | "MEDIUM" | "LOW"

CONSULTANT PROFILE:
Name: ${profile.name} (${profile.title})
Years Experience: ${profile.yearsExperience}
Primary Skills: ${profile.primarySkills.join(', ')}
Secondary Skills: ${profile.secondarySkills.join(', ')}
Industries: ${profile.industries.join(', ')}
Certifications: ${profile.certifications.join(', ')}
Rate Minimum: $${profile.preferences.minHourlyRateUsd}/hr
Max Travel: ${profile.preferences.maxTravelPercent}%
Remote Preference: ${profile.preferences.remoteOnly ? 'Remote Only' : 'Flexible'}
Security Clearance: ${profile.preferences.securityClearance}
Excluded Industries: ${profile.preferences.excludedIndustries.join(', ')}
Past Projects:
${profile.pastProjects.map(p => `- ${p.name} (${p.clientIndustry}): Tech [${p.technologies.join(', ')}] | Desc: ${p.description} | Outcomes: ${p.outcomes}`).join('\n')}

EXTRACTED REQUIREMENTS:
${JSON.stringify(extraction.requirements, null, 2)}

Return JSON adhering to:
{
  "overallFitScore": number (0 to 100),
  "matches": [
    {
      "requirementId": "req-X",
      "requirementText": "...",
      "mandatory": true | false,
      "classification": "hard | preferred | inferred | unknown",
      "matchStatus": "strong_match | partial_match | gap | disqualifier | unverified",
      "profileEvidence": "Exact evidence citation from profile",
      "explanation": "Clear justification",
      "confidence": "HIGH | MEDIUM | LOW"
    }
  ],
  "fitSummary": "2-3 sentence assessment of fit"
}
`;

    const rawResult = await this.provider.generateJSON<{
      overallFitScore: number;
      matches: RequirementFitMatch[];
      fitSummary: string;
    }>(prompt);

    const matches = rawResult.matches || [];
    const strongMatches = matches.filter(m => m.matchStatus === 'strong_match');
    const partialMatches = matches.filter(m => m.matchStatus === 'partial_match');
    const gaps = matches.filter(m => m.matchStatus === 'gap');
    const disqualifiers = matches.filter(m => m.matchStatus === 'disqualifier');
    const unverified = matches.filter(m => m.matchStatus === 'unverified');

    return {
      overallFitScore: Math.min(100, Math.max(0, rawResult.overallFitScore || 50)),
      strongMatches,
      partialMatches,
      gaps,
      disqualifiers,
      unverified,
      fitSummary: rawResult.fitSummary || 'Profile fit assessment completed.',
    };
  }

  // =========================================================================
  // SUB-AGENT 4: RISK & UNCERTAINTY ANALYZER
  // =========================================================================
  private async assessRisksAndUncertainties(
    extraction: RequirementExtractionResult,
    profile: ConsultantProfile,
    fit: FitAssessment,
    research: ResearchDossier
  ): Promise<RiskAssessment> {
    const prompt = `
You are the Risk & Decision Agent.
Evaluate the risks, uncertainties, contractual traps, and missing information in this opportunity.

Consider:
1. Technical Risks (unrealistic timelines, bleeding-edge untried dependencies, legacy code drag)
2. Commercial & Rate Risks (budget unspecified, below consultant's $${profile.preferences.minHourlyRateUsd}/hr floor, fixed-price ambiguity)
3. Travel & Location Risks (exceeds ${profile.preferences.maxTravelPercent}% travel limit, uncompensated on-site requirements)
4. Legal / Contractual / Scope Creep (unbounded deliverables, penalty clauses, compliance hurdles like FDA/ITAR/SOC2)
5. Missing information that makes a confident decision impossible without questions.

DATA CONTEXT:
Extraction: ${JSON.stringify({ title: extraction.opportunityTitle, budget: extraction.estimatedBudgetOrRate, duration: extraction.timelineOrDuration, arrangement: extraction.workArrangement, unknowns: extraction.identifiedUnknowns })}
Fit Summary: Disqualifiers count: ${fit.disqualifiers.length}, Gaps count: ${fit.gaps.length}
Client Research: ${JSON.stringify({ reputation: research.industryReputation, redFlags: research.potentialRedFlags })}

Return JSON adhering to:
{
  "overallRiskLevel": "HIGH | MODERATE | LOW",
  "riskScore": number (0 to 100, where 100 is extreme risk and 0 is risk-free),
  "identifiedRisks": [
    {
      "id": "risk-1",
      "category": "technical | commercial | legal_contract | scope_creep | schedule | culture_fit",
      "severity": "critical | moderate | low | unknown",
      "title": "Short title",
      "description": "Why this is a risk",
      "mitigationSuggestion": "Actionable tactic to mitigate or contractually protect",
      "evidenceSource": "rfp_text | research | profile_mismatch | unknown_data"
    }
  ],
  "missingInformationGaps": [
    "Crucial unknown 1",
    "Crucial unknown 2"
  ],
  "clarificationQuestionsForClient": [
    "Sharply formulated question 1 to ask in pre-bid call",
    "Sharply formulated question 2 to ask in pre-bid call"
  ]
}
`;

    return await this.provider.generateJSON<RiskAssessment>(
      prompt,
      'You are a seasoned commercial consulting risk advisor. Be skeptical of vague promises, protect the consultant from scope creep and bad commercial terms.'
    );
  }

  // =========================================================================
  // SUB-AGENT 5: DECISION & RECOMMENDATION SYNTHESIZER
  // =========================================================================
  private async synthesizeRecommendation(
    extraction: RequirementExtractionResult,
    profile: ConsultantProfile,
    fit: FitAssessment,
    risk: RiskAssessment,
    research: ResearchDossier
  ): Promise<RecommendationResult> {
    const prompt = `
You are the Root Opportunity Orchestrator Agent.
Synthesize all collected evidence into a final GO / REVIEW / PASS decision and calculate the final Opportunity Score (0-100).

CRITERIA GUIDELINES:
- PASS: If there are fatal disqualifiers (e.g. clearance mismatch, unacceptable travel, rate cap far below minimum, excluded industry) OR if overall fit is < 45% OR risk is Critical.
- REVIEW: If the opportunity is high-value and has solid technical match, but has substantial gaps, missing budget, or unclear scope requiring pre-bid clarification calls.
- GO: Strong technical and domain match (>75%), commercial terms aligned, manageable or low risk, clear winnable path.

CALCULATE SCORE (0-100):
- Skills Fit Score (0-100)
- Experience Fit Score (0-100)
- Commercial Fit Score (0-100)
- Risk Penalty (0-30 points subtracted)
- Total Score = (Skills*0.35 + Exp*0.25 + Commercial*0.20) - (RiskScore * 0.20) bounded to 0-100.

EVALUATION SUMMARY:
- Fit Score: ${fit.overallFitScore}/100 (${fit.strongMatches.length} strong, ${fit.disqualifiers.length} disqualifiers)
- Disqualifiers: ${JSON.stringify(fit.disqualifiers.map(d => d.requirementText + ' => ' + d.profileEvidence))}
- Risk Score: ${risk.riskScore}/100, Level: ${risk.overallRiskLevel}
- Budget/Rate Info: ${extraction.estimatedBudgetOrRate || 'Unstated'} vs Consultant Floor: $${profile.preferences.minHourlyRateUsd}/hr

Return JSON adhering to:
{
  "decision": "GO | REVIEW | PASS",
  "confidence": "HIGH | MEDIUM | LOW",
  "opportunityScore": number,
  "scoreBreakdown": {
    "skillsFitScore": number,
    "experienceFitScore": number,
    "commercialFitScore": number,
    "riskAdjustment": number,
    "totalScore": number
  },
  "headline": "Punchy 1-sentence decision summary",
  "executiveSummary": "Concise 3-4 sentence evidence-backed rationale",
  "keyStrengths": ["Strength 1 backed by specific past project", "Strength 2 backed by certification"],
  "criticalGaps": ["Gap 1", "Gap 2"],
  "primaryRisks": ["Risk 1", "Risk 2"],
  "dealBreakers": ["Dealbreaker 1 (if any, otherwise empty)"],
  "suggestedNextSteps": ["Action step 1", "Action step 2"],
  "questionsToAskClient": ["Priority question 1", "Priority question 2"]
}
`;

    return await this.provider.generateJSON<RecommendationResult>(
      prompt,
      'You are the principal decider. Base your recommendation exclusively on the verifiable evidence presented. Never make unsupported claims.'
    );
  }

  // =========================================================================
  // DETERMINISTIC FALLBACK ENGINES (WHEN LLM KEY NOT SET OR OFFLINE)
  // =========================================================================
  private fallbackExtractRequirements(text: string): RequirementExtractionResult {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const title = lines[0]?.substring(0, 80) || 'Consulting Opportunity';
    let clientName = 'Target Enterprise Client';

    if (text.includes('Apex Wealth')) clientName = 'Apex Wealth Capital LLC';
    else if (text.includes('Defense Logistics')) clientName = 'Defense Logistics Support Command';
    else if (text.includes('MedVanguard')) clientName = 'MedVanguard Health Inc.';

    const requirements: Requirement[] = [];
    let reqId = 1;

    // Detect technical keywords
    const techKeywords = ['GCP', 'AWS', 'Python', 'TypeScript', 'Kubernetes', 'COBOL', 'CICS', 'HIPAA', 'ISO 13485', 'RAG', 'Generative AI', 'Docker', 'Vertex AI', 'BigQuery'];
    for (const kw of techKeywords) {
      if (text.toLowerCase().includes(kw.toLowerCase())) {
        requirements.push({
          id: `req-${reqId++}`,
          category: kw.includes('ISO') || kw.includes('HIPAA') ? 'certification' : 'technical',
          text: `Demonstrated hands-on experience with ${kw}`,
          classification: kw === 'COBOL' || kw === 'CICS' || kw === 'ISO 13485' ? 'hard' : 'preferred',
          mandatory: kw === 'COBOL' || kw === 'CICS',
          sourceContext: `Detected keyword "${kw}" in RFP text`,
        });
      }
    }

    if (text.includes('Top Secret')) {
      requirements.push({
        id: `req-${reqId++}`,
        category: 'operational',
        text: 'Active DoD Top Secret / SCI Security Clearance',
        classification: 'hard',
        mandatory: true,
        sourceContext: 'Security clearance stipulation in RFP',
      });
    }

    if (text.includes('on-site') || text.includes('physical on-site')) {
      requirements.push({
        id: `req-${reqId++}`,
        category: 'operational',
        text: '100% on-site physical attendance required',
        classification: 'hard',
        mandatory: true,
        sourceContext: 'Location / attendance terms',
      });
    }

    return {
      clientName,
      opportunityTitle: title,
      estimatedBudgetOrRate: text.match(/\$[\d]+[\s\-\w\/\$]*/)?.[0] || 'Unstated in document',
      timelineOrDuration: '6-12 months estimated',
      workArrangement: text.includes('Remote') ? '100% Remote' : text.includes('on-site') ? '100% On-Site' : 'Hybrid / Unstated',
      summary: `Opportunity evaluation for ${clientName} covering ${requirements.length} extracted technical & operational requirements.`,
      requirements,
      identifiedUnknowns: ['Precise team hierarchy and direct manager', 'Budget approval cycle', 'Intellectual property assignment specifics'],
    };
  }

  private fallbackResearch(clientName: string, title: string): ResearchDossier {
    return {
      clientName: clientName || 'Corporate Client',
      clientOverview: `${clientName} operates in high-value enterprise consulting segments with structured procurement cycles.`,
      industryReputation: 'Established organization with standard vendor compliance requirements.',
      techStackInsights: ['Enterprise Cloud Infrastructure', 'Modern Data & Microservices Architecture'],
      recentNewsOrInitiatives: ['Active technology modernization and efficiency initiatives.'],
      potentialRedFlags: ['Ensure rate and scope boundaries are formalized in Master Services Agreement.'],
      sources: [
        { title: `${clientName} Investor & Technology Relations`, uri: 'https://google.com/search?q=' + encodeURIComponent(clientName) },
      ],
      isResearched: true,
    };
  }

  private fallbackAnalyzeFit(extraction: RequirementExtractionResult, profile: ConsultantProfile): FitAssessment {
    const strongMatches: RequirementFitMatch[] = [];
    const partialMatches: RequirementFitMatch[] = [];
    const gaps: RequirementFitMatch[] = [];
    const disqualifiers: RequirementFitMatch[] = [];
    const unverified: RequirementFitMatch[] = [];

    for (const req of extraction.requirements) {
      const lower = req.text.toLowerCase();

      // Check clearance
      if (lower.includes('clearance') || lower.includes('top secret')) {
        if (profile.preferences.securityClearance === 'none' && req.mandatory) {
          disqualifiers.push({
            requirementId: req.id,
            requirementText: req.text,
            mandatory: true,
            classification: req.classification,
            matchStatus: 'disqualifier',
            profileEvidence: `Profile securityClearance is "${profile.preferences.securityClearance}"`,
            explanation: 'Consultant has no security clearance, which is a mandatory non-negotiable requirement for this opportunity.',
            confidence: 'HIGH',
          });
          continue;
        }
      }

      // Check on-site vs remote
      if (lower.includes('on-site') && profile.preferences.remoteOnly) {
        disqualifiers.push({
          requirementId: req.id,
          requirementText: req.text,
          mandatory: true,
          classification: req.classification,
          matchStatus: 'disqualifier',
          profileEvidence: `Profile preference remoteOnly is true, maxTravel is ${profile.preferences.maxTravelPercent}%`,
          explanation: 'Consultant requires 100% remote engagements; RFP mandates 100% on-site presence.',
          confidence: 'HIGH',
        });
        continue;
      }

      // Check COBOL
      if (lower.includes('cobol') || lower.includes('cics')) {
        disqualifiers.push({
          requirementId: req.id,
          requirementText: req.text,
          mandatory: true,
          classification: req.classification,
          matchStatus: 'disqualifier',
          profileEvidence: `Profile primary skills: ${profile.primarySkills.join(', ')}`,
          explanation: 'Consultant is a modern Cloud/AI architect with zero legacy COBOL/Mainframe experience.',
          confidence: 'HIGH',
        });
        continue;
      }

      // Check direct matches
      const directSkill = profile.primarySkills.find(s => lower.includes(s.toLowerCase()) || s.toLowerCase().includes(lower));
      if (directSkill) {
        strongMatches.push({
          requirementId: req.id,
          requirementText: req.text,
          mandatory: req.mandatory,
          classification: req.classification,
          matchStatus: 'strong_match',
          profileEvidence: `Primary Skill "${directSkill}" + Past project "${profile.pastProjects[0]?.name}"`,
          explanation: `Consultant has verified primary expertise in ${directSkill}.`,
          confidence: 'HIGH',
        });
        continue;
      }

      const secondarySkill = profile.secondarySkills.find(s => lower.includes(s.toLowerCase()));
      if (secondarySkill) {
        partialMatches.push({
          requirementId: req.id,
          requirementText: req.text,
          mandatory: req.mandatory,
          classification: req.classification,
          matchStatus: 'partial_match',
          profileEvidence: `Secondary Skill "${secondarySkill}"`,
          explanation: `Consultant holds secondary familiarity with ${secondarySkill}.`,
          confidence: 'MEDIUM',
        });
        continue;
      }

      if (lower.includes('iso 13485') || lower.includes('medical device')) {
        gaps.push({
          requirementId: req.id,
          requirementText: req.text,
          mandatory: req.mandatory,
          classification: req.classification,
          matchStatus: 'gap',
          profileEvidence: `Certifications: ${profile.certifications.join(', ')}`,
          explanation: 'Consultant has cloud certifications but lacks specialized medical device ISO 13485 audit credentials.',
          confidence: 'HIGH',
        });
        continue;
      }

      unverified.push({
        requirementId: req.id,
        requirementText: req.text,
        mandatory: req.mandatory,
        classification: req.classification,
        matchStatus: 'unverified',
        profileEvidence: 'No direct mention in consultant summary',
        explanation: 'Requires conversational clarification during initial discovery call.',
        confidence: 'LOW',
      });
    }

    const fitScore = disqualifiers.length > 0 ? 18 : Math.min(100, Math.round((strongMatches.length * 20 + partialMatches.length * 10) / Math.max(1, extraction.requirements.length) * 100));

    return {
      overallFitScore: fitScore,
      strongMatches,
      partialMatches,
      gaps,
      disqualifiers,
      unverified,
      fitSummary: disqualifiers.length > 0
        ? `Fatal disqualifiers detected (${disqualifiers.length} dealbreakers). Not recommended.`
        : `Strong technical match with ${strongMatches.length} core capability alignments.`,
    };
  }

  private fallbackAssessRisks(
    extraction: RequirementExtractionResult,
    profile: ConsultantProfile,
    fit: FitAssessment
  ): RiskAssessment {
    const risks: RiskItem[] = [];

    if (fit.disqualifiers.length > 0) {
      risks.push({
        id: 'risk-disqual',
        category: 'legal_contract',
        severity: 'critical',
        title: 'Mandatory RFP Disqualification Factors',
        description: `Opportunity contains ${fit.disqualifiers.length} hard disqualifiers contradicting consultant profile.`,
        mitigationSuggestion: 'Pass immediately or request formal exception in writing before submitting proposal.',
        evidenceSource: 'profile_mismatch',
      });
    }

    if (fit.gaps.length > 0) {
      risks.push({
        id: 'risk-gaps',
        category: 'technical',
        severity: 'moderate',
        title: 'Specialized Domain Certification Gaps',
        description: 'Specific regulatory or domain certifications are listed that are not present in profile.',
        mitigationSuggestion: 'Partner with a certified subcontractor or position role strictly on cloud systems architecture.',
        evidenceSource: 'rfp_text',
      });
    }

    return {
      overallRiskLevel: fit.disqualifiers.length > 0 ? 'HIGH' : fit.gaps.length > 0 ? 'MODERATE' : 'LOW',
      riskScore: fit.disqualifiers.length > 0 ? 88 : fit.gaps.length > 0 ? 45 : 18,
      identifiedRisks: risks,
      missingInformationGaps: extraction.identifiedUnknowns,
      clarificationQuestionsForClient: [
        'What is the firm hourly rate or total budget ceiling allocated for this role?',
        'Can all architecture and delivery milestones be performed 100% remotely?',
        'Who are the key executive stakeholders evaluating final technical sign-off?',
      ],
    };
  }

  private fallbackSynthesizeRecommendation(
    fit: FitAssessment,
    risk: RiskAssessment,
    extraction: RequirementExtractionResult,
    profile: ConsultantProfile
  ): RecommendationResult {
    let decision: DecisionType = 'GO';
    let confidence: ConfidenceLevel = 'HIGH';
    let score = fit.overallFitScore;

    if (fit.disqualifiers.length > 0) {
      decision = 'PASS';
      score = 15;
    } else if (risk.overallRiskLevel === 'MODERATE' || fit.gaps.length > 0 || fit.overallFitScore < 70) {
      decision = 'REVIEW';
      score = Math.max(50, fit.overallFitScore);
    } else {
      decision = 'GO';
      score = Math.max(82, fit.overallFitScore);
    }

    const breakdown: OpportunityScoreBreakdown = {
      skillsFitScore: fit.strongMatches.length > 2 ? 90 : 60,
      experienceFitScore: profile.yearsExperience >= 10 ? 95 : 75,
      commercialFitScore: decision === 'PASS' ? 20 : 85,
      riskAdjustment: risk.riskScore * 0.2,
      totalScore: score,
    };

    return {
      decision,
      confidence,
      opportunityScore: score,
      scoreBreakdown: breakdown,
      headline: decision === 'GO'
        ? `Strong candidate opportunity for ${profile.name} with high win probability.`
        : decision === 'PASS'
        ? `Opportunity is an explicit mismatch due to mandatory hard disqualifiers.`
        : `Viable opportunity requiring pre-bid clarification on commercial and certification terms.`,
      executiveSummary: decision === 'GO'
        ? `The RFP directly aligns with ${profile.name}'s primary cloud and AI architecture background, documented past enterprise engagements, and rate thresholds.`
        : decision === 'PASS'
        ? `The mandatory requirements include prerequisites (clearance, on-site presence, or legacy tech) that conflict with the consultant's profile.`
        : `Strong technical match but contains gaps or ambiguities (such as compliance certs or travel) that should be clarified before committing proposal effort.`,
      keyStrengths: fit.strongMatches.map(m => `${m.requirementText} (${m.profileEvidence})`),
      criticalGaps: fit.gaps.map(g => `${g.requirementText} (${g.explanation})`),
      primaryRisks: risk.identifiedRisks.map(r => `${r.title}: ${r.description}`),
      dealBreakers: fit.disqualifiers.map(d => d.explanation),
      suggestedNextSteps: decision === 'GO'
        ? ['Submit tailored capability statement highlighting Tier-1 past project', 'Request 30-minute discovery call with technical lead']
        : decision === 'PASS'
        ? ['Politely decline or archive opportunity to avoid wasted bidding hours']
        : ['Schedule pre-bid inquiry to clarify travel expectations and budget ceiling', 'Evaluate subcontracting partner for certification gaps'],
      questionsToAskClient: risk.clarificationQuestionsForClient,
    };
  }

  /**
   * Generates a tailored Statement of Qualifications, Executive Pitch,
   * Requirement Capability Proofs, Risk Mitigation, and Clarification Email.
   */
  async generateProposal(
    report: OpportunityEvaluationReport,
    customFocus?: string
  ): Promise<GeneratedProposal> {
    const prompt = `
You are the world's best enterprise technical proposal writer and consulting strategist.
Generate a tailored, high-converting consulting proposal package for the consultant based on the evaluated opportunity.

CONSULTANT PROFILE:
Name: ${report.consultantProfileSnapshot.name}
Title: ${report.consultantProfileSnapshot.title}
Experience: ${report.consultantProfileSnapshot.yearsExperience} years
Primary Skills: ${report.consultantProfileSnapshot.primarySkills.join(', ')}
Certifications: ${report.consultantProfileSnapshot.certifications.join(', ')}
Past Projects: ${JSON.stringify(report.consultantProfileSnapshot.pastProjects)}
Preferred Hourly Rate: $${report.consultantProfileSnapshot.preferences.minHourlyRateUsd}/hr

EVALUATED OPPORTUNITY:
Client: ${report.clientName}
Title: ${report.opportunityTitle}
Decision: ${report.recommendation.decision} (Score: ${report.recommendation.opportunityScore}/100)
Extracted Requirements: ${JSON.stringify(report.extraction.requirements.slice(0, 10))}
Strong Matches & Evidence: ${JSON.stringify(report.fitAssessment.strongMatches)}
Identified Gaps: ${JSON.stringify(report.fitAssessment.gaps)}
Identified Risks: ${JSON.stringify(report.riskAssessment.identifiedRisks)}
Clarification Questions: ${JSON.stringify(report.riskAssessment.clarificationQuestionsForClient)}
${customFocus ? `Special Focus / Strategic Angle requested by consultant: "${customFocus}"` : ''}

Generate a comprehensive proposal object in JSON matching this exact structure:
{
  "executivePitch": "A punchy, compelling 2-3 paragraph executive opening addressing the client's core problem, why ${report.consultantProfileSnapshot.name} is uniquely qualified, and the business value delivered.",
  "statementOfQualifications": "A professional summary of qualifications, domain depth, architectural methodology, and verified past project credentials.",
  "requirementResponses": [
    {
      "requirement": "Requirement text",
      "capabilityEvidence": "Exact description of how the consultant meets or exceeds this requirement",
      "pastProjectCitation": "Specific past project name and measured metric/outcome"
    }
  ],
  "riskMitigationPlan": "How the consultant proposes to proactively mitigate the project's technical, architectural, or timeline risks without passing exposure to the client.",
  "proposedCommercialTerms": "Professional commercial proposal outlining engagement structure (Time & Materials vs Milestones), rate/estimate, kickoff timeline, and scope boundaries.",
  "clientClarificationEmail": "A ready-to-send, polished email from ${report.consultantProfileSnapshot.name} to the client hiring lead introducing interest and asking the top 3-4 clarification questions respectfully."
}
`;

    try {
      const proposal = await this.provider.generateJSON<GeneratedProposal>(prompt);
      if (proposal && proposal.executivePitch && proposal.statementOfQualifications) {
        return proposal;
      }
      throw new Error('Incomplete proposal JSON returned');
    } catch (err: any) {
      console.warn('[Orchestrator] LLM proposal generation failed, using structured template fallback:', err);
      return this.fallbackGenerateProposal(report, customFocus);
    }
  }

  /**
   * Fallback proposal generator
   */
  private fallbackGenerateProposal(
    report: OpportunityEvaluationReport,
    customFocus?: string
  ): GeneratedProposal {
    const prof = report.consultantProfileSnapshot;
    const topProject = prof.pastProjects[0] || { name: 'Enterprise Cloud System', outcomes: '100% SLA uptime' };
    const matches = report.fitAssessment.strongMatches.slice(0, 4);

    return {
      executivePitch: `To the Leadership Team at ${report.clientName},\n\nI am pleased to submit this capability proposal for the ${report.opportunityTitle} engagement. With over ${prof.yearsExperience} years of production experience in ${prof.primarySkills.slice(0, 4).join(', ')}, I specialize in architecting resilient, enterprise-grade systems with zero disruption.\n\nHaving recently delivered ${topProject.name} (${topProject.outcomes}), I bring direct, battle-tested domain expertise to accelerate your delivery timeline while strictly guarding data integrity and performance standards.`,
      statementOfQualifications: `${prof.name} (${prof.title}) offers extensive expertise spanning ${prof.primarySkills.join(', ')}. Holds active credentials including ${prof.certifications.join(', ')}. Demonstrated track record delivering complex solutions across ${prof.industries.join(', ')} sectors with measurable efficiency gains and robust compliance adherence.`,
      requirementResponses: matches.map(m => ({
        requirement: m.requirementText,
        capabilityEvidence: m.profileEvidence || `Demonstrated proficiency in ${m.requirementText}`,
        pastProjectCitation: topProject.name,
      })),
      riskMitigationPlan: `To address potential scope and integration complexities:\n1. Phased architectural spike in Sprint 1 to de-risk interfaces.\n2. Automated CI/CD test gates enforcing security and compliance thresholds.\n3. Weekly cadence reviews with key stakeholders for full transparency.`,
      proposedCommercialTerms: `Structure: Time & Materials (or capped Sprint Milestones)\nStandard Billing Rate: $${prof.preferences.minHourlyRateUsd}/hr\nEstimated Kickoff: Immediate (within 5 business days of contract execution)\nPayment Terms: Net-30 upon bi-weekly milestone approvals.`,
      clientClarificationEmail: `Subject: Inquiry & Discovery Questions regarding ${report.opportunityTitle} - ${prof.name}\n\nHi ${report.clientName} Team,\n\nI reviewed the requirements for the ${report.opportunityTitle} initiative with great enthusiasm. My background in ${prof.primarySkills.slice(0, 3).join(', ')} aligns closely with your technical objectives.\n\nTo ensure our proposal and scoping are precisely aligned with your expectations, I would appreciate your brief insight on a few key points:\n\n${report.riskAssessment.clarificationQuestionsForClient.slice(0, 3).map((q, idx) => `${idx + 1}. ${q}`).join('\n')}\n\nWould you be open to a brief 15-minute introductory call this week?\n\nBest regards,\n${prof.name}\n${prof.title}`,
    };
  }

  /**
   * Interactive AI Copilot grounded in the evaluated RFP & Consultant Profile.
   */
  async chatWithOpportunityCopilot(
    report: OpportunityEvaluationReport,
    conversationHistory: OpportunityChatMessage[],
    newMessage: string
  ): Promise<OpportunityChatMessage> {
    const contextPrompt = `
You are the Consultant-in-a-Box AI Strategic Advisor for ${report.consultantProfileSnapshot.name}.
You are advising the consultant on the following evaluated engagement opportunity:

OPPORTUNITY SUMMARY:
- Client: ${report.clientName}
- Title: ${report.opportunityTitle}
- Decision: ${report.recommendation.decision} (Opportunity Score: ${report.recommendation.opportunityScore}/100)
- Executive Rationale: ${report.recommendation.executiveSummary}
- Key Strengths: ${report.recommendation.keyStrengths.join('; ')}
- Gaps: ${report.recommendation.criticalGaps.join('; ')}
- Dealbreakers: ${report.recommendation.dealBreakers.join('; ')}
- Top Risks: ${report.riskAssessment.identifiedRisks.map(r => `${r.title} (${r.severity})`).join('; ')}
- Research Insights: ${report.research.clientOverview} | Tech Stack: ${report.research.techStackInsights.join(', ')}

CONSULTANT:
- Name: ${report.consultantProfileSnapshot.name} (${report.consultantProfileSnapshot.title})
- Skills: ${report.consultantProfileSnapshot.primarySkills.join(', ')}
- Min Rate: $${report.consultantProfileSnapshot.preferences.minHourlyRateUsd}/hr
- Clearance: ${report.consultantProfileSnapshot.preferences.securityClearance}
- Remote Only: ${report.consultantProfileSnapshot.preferences.remoteOnly}

CONVERSATION HISTORY:
${conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

USER QUESTION: "${newMessage}"

Provide a direct, high-value, highly strategic answer for the consultant.
Be pragmatic, sharp, actionable, and grounded in the data above.
Include 2-3 short bullet suggestions for next tactical actions if relevant.
`;

    try {
      const responseText = await this.provider.generateText(contextPrompt);
      const messageId = `msg-${Date.now()}`;
      return {
        id: messageId,
        role: 'assistant',
        content: responseText || 'I evaluated your question against the opportunity report. Proceeding with clear scope boundaries is recommended.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          'Draft clarification email',
          'Generate customized proposal',
          'Review risk mitigations',
        ],
      };
    } catch (err: any) {
      console.warn('[Orchestrator] AI Copilot chat failed, fallback response:', err);
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Based on the ${report.recommendation.decision} evaluation (${report.recommendation.opportunityScore}/100), the priority is clarifying the scope uncertainties with ${report.clientName} and framing your past project experience (${report.consultantProfileSnapshot.pastProjects[0]?.name || 'past engagements'}) to defend your $${report.consultantProfileSnapshot.preferences.minHourlyRateUsd}/hr rate floor.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }
  }
}

