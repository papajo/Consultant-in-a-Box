export interface SampleRFP {
  id: string;
  title: string;
  clientName: string;
  tagline: string;
  expectedOutcome: 'GO' | 'PASS' | 'REVIEW';
  category: string;
  content: string;
}

export const SAMPLE_RFPS: SampleRFP[] = [
  {
    id: 'rfp-apex-ai-go',
    title: 'Enterprise Agentic AI & RAG Knowledge Engine (RFP-2026-AI-88)',
    clientName: 'Apex Wealth Capital LLC',
    tagline: 'Ideal strong fit: GCP + LLM Architect, high budget ($240-275/hr), 100% remote',
    expectedOutcome: 'GO',
    category: 'Financial Services / AI Architecture',
    content: `REQUEST FOR PROPOSALS (RFP)
DOCUMENT ID: RFP-2026-AI-88
ISSUING ORGANIZATION: Apex Wealth Capital LLC (New York, NY)
PROJECT TITLE: Next-Generation Agentic AI Knowledge Platform & Cloud Modernization

1. EXECUTIVE OVERVIEW
Apex Wealth Capital is a tier-1 private wealth management and market research firm managing $14B in assets. We are soliciting proposals for a Principal AI & Cloud Solutions Architect to design and guide the implementation of an autonomous research agent platform. The system will ingest daily market reports, regulatory filings, financial statements, and proprietary analyst notes, synthesizing actionable investment intelligence for our 450 portfolio managers and research analysts.

2. SCOPE OF WORK & RESPONSIBILITIES
- Architect an enterprise-grade Multi-Agent RAG (Retrieval-Augmented Generation) pipeline hosted on Google Cloud Platform (GCP).
- Establish vector search indexing over 20M+ structured and unstructured financial records with sub-second retrieval latency.
- Design role-based access control (RBAC), data isolation per fund, and automated audit trails compliant with SEC/FINRA and SOC2 Type II standards.
- Build Python/TypeScript microservices deployed on Google Cloud Run and Kubernetes (GKE).
- Advise executive leadership and technical staff on LLM evaluation metrics, hallucination mitigation, and prompt telemetry.
- Lead technical due diligence and sprint architecture reviews for an internal team of 6 engineers.

3. MANDATORY REQUIREMENTS (HARD REQUIREMENTS)
- Minimum 10+ years of demonstrable software engineering and distributed cloud systems architecture experience.
- Deep, hands-on production expertise in Google Cloud Platform (GCP), specifically Vertex AI, Cloud Run, BigQuery, and GKE.
- Proven track record designing and deploying production Generative AI / RAG / Multi-Agent architectures with documented outcomes.
- Advanced proficiency in Python and TypeScript.
- Strong grounding in enterprise cloud security, data encryption at rest/in-transit, and role-based access governance.
- GCP Professional Cloud Architect or Data Engineer certification strongly preferred.

4. COMMERCIAL TERMS & LOGISTICS
- Engagement Duration: 6 months initial contract, with option to extend to 12 months.
- Estimated Effort: 30 to 40 hours per week.
- Target Rate Range: $230 - $280 / hour (Time & Materials).
- Location / Travel: 100% Remote (US/Canada timezones). Optional quarterly 2-day team summit in NYC (all travel expenses paid).
- Security Clearance: None required. Standard corporate background check & NDA.
- Target Start Date: Within 3-4 weeks of contract signing.

5. SUBMISSION GUIDELINES
Submit detailed architectural approach, past relevant case studies, hourly rate proposal, and availability schedule by March 15, 2026.`
  },
  {
    id: 'rfp-dod-cobol-pass',
    title: 'On-Site Legacy Mainframe & COBOL System Modernization (RFP-DOD-9921)',
    clientName: 'Defense Logistics Support Command (Prime Subcontract)',
    tagline: 'Definite PASS: Top Secret clearance required, 100% on-site in Ohio, COBOL/CICS, rate cap $115/hr',
    expectedOutcome: 'PASS',
    category: 'Government / Defense Logistics',
    content: `SOLICITATION NOTICE: RFP-DOD-9921-MOD
ISSUING ENTITY: Federal Defense Logistics Contractor Consortium
PROJECT: Air Depot Logistics Management System (LMS) Mainframe Re-platforming

1. STATEMENT OF OBJECTIVES
The contractor shall provide dedicated on-site Senior Mainframe & Legacy Systems engineering support to maintain, optimize, and incrementally migrate legacy IBM z/OS Mainframe applications running critical parts distribution and supply tracking logistics.

2. SCOPE OF SERVICES & TECHNICAL ENVIRONMENT
- Daily maintenance, debugging, and batch job optimization for 4.2 million lines of legacy COBOL and CICS transactions.
- Refactor DB2 database stored procedures and optimize JCL (Job Control Language) scripts.
- Support migration of legacy green-screen terminals to internal web-based terminal emulators.
- Maintain strict DoD STIG security compliance across all on-premises mainframe hardware and tape storage backup systems.

3. MANDATORY QUALIFICATIONS (NON-NEGOTIABLE DISQUALIFIERS)
- Active DoD Top Secret / SCI Security Clearance with Polygraph at time of award. Proposals without active verified clearance will be discarded without review.
- Minimum 12+ years hands-on legacy COBOL, CICS, JCL, and IBM z/OS mainframe assembly experience.
- 100% physical on-site presence required 5 days per week at Wright-Patterson AFB facility (Dayton, Ohio). Absolutely no telework or remote access authorized due to SCIF security protocols.
- US Citizenship mandatory.
- Defense logistics domain experience and familiarity with MIL-STD data interchange formats.

4. CONTRACT PRICING & PERIOD OF PERFORMANCE
- Period of Performance: Base 1 year + 4 option years.
- Pricing Structure: Firm Fixed Hourly Rate capped at maximum allowable rate of $115.00 / hour inclusive of all local travel and overhead.
- Weapons & defense systems supply chain domain.`
  },
  {
    id: 'rfp-medvanguard-review',
    title: 'Clinical Diagnostic AI Model Pipeline & Medical Device Compliance',
    clientName: 'MedVanguard Health Inc.',
    tagline: 'Needs Careful REVIEW: Strong AI match, but requires ISO 13485 certification, 40% travel, and budget is unstated',
    expectedOutcome: 'REVIEW',
    category: 'Healthcare / Medical Devices / AI',
    content: `REQUEST FOR PROPOSALS: MVP-2026-MEDAI
ISSUER: MedVanguard Health Inc. (Boston, MA & San Diego, CA)
PROJECT: Real-Time Pathology Image Segmentation & Diagnostic Assistant Architecture

1. PROJECT OVERVIEW
MedVanguard is developing an FDA Software as a Medical Device (SaMD) product utilizing computer vision and multimodal foundation models to assist clinical pathologists in detecting cellular anomalies during live surgical biopsies. We seek an experienced AI Systems Consultant to validate model deployment architecture, latency optimization, and compliance posture.

2. DELIVERABLES & TECHNICAL REQUIREMENTS
- Validate cloud and edge inference pipelines for sub-100ms multi-gigapixel whole slide pathology images.
- Review infrastructure architecture against HIPAA, GDPR, and FDA 510(k) cybersecurity guidelines.
- Establish automated model drift monitoring, data lineage tracking, and explainability frameworks.
- Prepare technical documentation for FDA pre-market submission review.

3. DESIRED QUALIFICATIONS
- 8+ years experience in distributed cloud systems and AI pipeline architecture (GCP or AWS).
- Proven familiarity with HealthTech, HIPAA data handling, and clinical workflows.
- Experience with high-throughput imaging or real-time ML inference.
- Direct prior experience with ISO 13485 (Medical Device Quality Management) and IEC 62304 software lifecycle standard is strongly required for audit readiness.

4. ENGAGEMENT LOGISTICS & TERMS
- Contract Type: Milestone-based / Deliverable-based contract with monthly retainer.
- Budget: Unstated / Requesting vendor to submit competitive proposal based on deliverables.
- Travel Requirement: Estimated 35% - 40% domestic travel to clinical pilot sites in Boston, MA and San Diego, CA for on-site hospital integration testing.
- Target Start: Immediate upon compliance clearance.`
  }
];
