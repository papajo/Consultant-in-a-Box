/**
 * Structured Data Models for Consultant-in-a-Box
 */

export type RequirementType = 'hard' | 'preferred' | 'inferred' | 'unknown';
export type MatchStatus = 'strong_match' | 'partial_match' | 'gap' | 'disqualifier' | 'unverified';
export type DecisionType = 'GO' | 'REVIEW' | 'PASS';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskSeverity = 'critical' | 'moderate' | 'low' | 'unknown';
export type RiskCategory = 'technical' | 'commercial' | 'legal_contract' | 'scope_creep' | 'schedule' | 'culture_fit';

export interface PastProject {
  id: string;
  name: string;
  clientIndustry: string;
  technologies: string[];
  description: string;
  outcomes: string;
  durationMonths: number;
}

export interface ConsultantProfile {
  id: string;
  name: string;
  title: string;
  summary: string;
  yearsExperience: number;
  primarySkills: string[];
  secondarySkills: string[];
  industries: string[];
  certifications: string[];
  pastProjects: PastProject[];
  preferences: {
    minHourlyRateUsd: number;
    preferredContractTypes: string[]; // e.g. ['T&M', 'Retainer', 'Fixed-Scope']
    maxTravelPercent: number; // 0 to 100
    remoteOnly: boolean;
    excludedIndustries: string[];
    securityClearance: 'none' | 'public_trust' | 'secret' | 'top_secret';
    preferredRoleTypes: string[]; // e.g. ['Architecture', 'Advisory', 'Hands-on Lead']
  };
}

export interface Requirement {
  id: string;
  category: 'technical' | 'domain' | 'certification' | 'experience' | 'operational' | 'commercial';
  text: string;
  classification: RequirementType;
  mandatory: boolean;
  sourceContext?: string;
}

export interface RequirementExtractionResult {
  clientName: string;
  opportunityTitle: string;
  estimatedBudgetOrRate?: string;
  timelineOrDuration?: string;
  workArrangement?: string; // remote, hybrid, on-site
  summary: string;
  requirements: Requirement[];
  identifiedUnknowns: string[];
}

export interface RequirementFitMatch {
  requirementId: string;
  requirementText: string;
  mandatory: boolean;
  classification: RequirementType;
  matchStatus: MatchStatus;
  profileEvidence: string; // specific citations from consultant profile
  explanation: string;
  confidence: ConfidenceLevel;
}

export interface FitAssessment {
  overallFitScore: number; // 0-100
  strongMatches: RequirementFitMatch[];
  partialMatches: RequirementFitMatch[];
  gaps: RequirementFitMatch[];
  disqualifiers: RequirementFitMatch[];
  unverified: RequirementFitMatch[];
  fitSummary: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ResearchDossier {
  clientName: string;
  clientOverview: string;
  industryReputation: string;
  techStackInsights: string[];
  recentNewsOrInitiatives: string[];
  potentialRedFlags: string[];
  sources: GroundingSource[];
  isResearched: boolean;
}

export interface RiskItem {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  title: string;
  description: string;
  mitigationSuggestion: string;
  evidenceSource: 'rfp_text' | 'research' | 'profile_mismatch' | 'unknown_data';
}

export interface RiskAssessment {
  overallRiskLevel: 'HIGH' | 'MODERATE' | 'LOW';
  riskScore: number; // 0-100 (higher = riskier)
  identifiedRisks: RiskItem[];
  missingInformationGaps: string[];
  clarificationQuestionsForClient: string[];
}

export interface OpportunityScoreBreakdown {
  skillsFitScore: number; // 0-100 (weight 35%)
  experienceFitScore: number; // 0-100 (weight 25%)
  commercialFitScore: number; // 0-100 (weight 20%)
  riskAdjustment: number; // penalty 0-30 points
  totalScore: number; // 0-100
}

export interface RecommendationResult {
  decision: DecisionType;
  confidence: ConfidenceLevel;
  opportunityScore: number; // 0-100
  scoreBreakdown: OpportunityScoreBreakdown;
  headline: string;
  executiveSummary: string;
  keyStrengths: string[];
  criticalGaps: string[];
  primaryRisks: string[];
  dealBreakers: string[];
  suggestedNextSteps: string[];
  questionsToAskClient: string[];
}

export interface AgentActivity {
  id: string;
  timestamp: string;
  phase: 'EXTRACT' | 'RESEARCH' | 'FIT_ANALYSIS' | 'RISK_ASSESS' | 'DECISION' | 'COMPLETE' | 'ERROR';
  agentName: string;
  action: string;
  details?: string;
  status: 'running' | 'done' | 'warning' | 'error';
  latencyMs?: number;
}

export interface OpportunityEvaluationReport {
  id: string;
  timestamp: string;
  opportunityTitle: string;
  clientName: string;
  rawInputSnippet: string;
  consultantProfileSnapshot: ConsultantProfile;
  extraction: RequirementExtractionResult;
  research: ResearchDossier;
  fitAssessment: FitAssessment;
  riskAssessment: RiskAssessment;
  recommendation: RecommendationResult;
  activityTrail: AgentActivity[];
}

export interface EvaluationState {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentPhase?: 'EXTRACT' | 'RESEARCH' | 'FIT_ANALYSIS' | 'RISK_ASSESS' | 'DECISION';
  progressPercent: number;
  report?: OpportunityEvaluationReport;
  activities: AgentActivity[];
  errorMessage?: string;
}
