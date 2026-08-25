import { ConsultantProfile } from '../types/agent.ts';

export const DEFAULT_PROFILES: ConsultantProfile[] = [
  {
    id: 'prof-senior-ai-arch',
    name: 'Elena Rostova, PhD',
    title: 'Principal AI & Cloud Architect / Fractional CTO',
    summary: '14+ years designing scalable distributed systems, cloud migrations (GCP/AWS), and production LLM/agentic applications for Fortune 500 and high-growth scale-ups.',
    yearsExperience: 14,
    primarySkills: [
      'Generative AI Architecture',
      'Google Cloud Platform (GCP)',
      'LangChain / Agentic Workflows',
      'Python & TypeScript',
      'Kubernetes & Microservices',
      'System Design & Security',
      'RAG & Vector Search',
      'Enterprise Data Pipelines'
    ],
    secondarySkills: [
      'AWS Solutions Architecture',
      'FastAPI / Node.js',
      'PostgreSQL / BigQuery',
      'Terraform / IaC',
      'Executive Stakeholder Management',
      'Tech Due Diligence'
    ],
    industries: [
      'Financial Services & FinTech',
      'SaaS & Enterprise Software',
      'HealthTech / Biotech',
      'E-commerce & Retail'
    ],
    certifications: [
      'Google Cloud Certified Professional Cloud Architect',
      'Google Cloud Certified Professional Data Engineer',
      'AWS Certified Solutions Architect – Professional'
    ],
    pastProjects: [
      {
        id: 'proj-1',
        name: 'Tier-1 Bank LLM Knowledge Platform',
        clientIndustry: 'Financial Services',
        technologies: ['GCP Vertex AI', 'Python', 'BigQuery', 'Terraform', 'Kubernetes'],
        description: 'Led architecture and security compliance for enterprise RAG system indexing 50M+ financial research documents with SOC2 and strict role-based access.',
        outcomes: 'Cut internal analyst research time by 45%, achieved zero compliance violations, scaled to 12,000 active users.',
        durationMonths: 9
      },
      {
        id: 'proj-2',
        name: 'Multi-Cloud GenAI Agent Engine',
        clientIndustry: 'Enterprise SaaS',
        technologies: ['TypeScript', 'FastAPI', 'Google Cloud Run', 'LangChain', 'PostgreSQL'],
        description: 'Designed autonomous workflow agents evaluating customer support tickets and automating complex triage actions.',
        outcomes: 'Automated 38% of tier-1 support tickets with 99.4% precision rate.',
        durationMonths: 6
      },
      {
        id: 'proj-3',
        name: 'Global E-Commerce Re-platforming',
        clientIndustry: 'E-commerce',
        technologies: ['GCP', 'GKE', 'Microservices', 'Kafka', 'Terraform'],
        description: 'Modernized monolithic legacy commerce engine into event-driven cloud microservices handling 25,000 QPS during peak holiday events.',
        outcomes: 'Reduced cloud infrastructure spend by 32% while eliminating peak downtime.',
        durationMonths: 14
      }
    ],
    preferences: {
      minHourlyRateUsd: 225,
      preferredContractTypes: ['Time & Materials (T&M)', 'Monthly Retainer', 'Fixed-Scope Advisory'],
      maxTravelPercent: 15,
      remoteOnly: true,
      excludedIndustries: ['Gambling', 'Tobacco', 'Defense Weapons Manufacturing'],
      securityClearance: 'none',
      preferredRoleTypes: ['Strategic Advisory', 'Architecture & System Design', 'High-Impact Prototyping']
    }
  },
  {
    id: 'prof-devops-sre',
    name: 'Marcus Vance',
    title: 'Senior DevOps & SRE Transformation Consultant',
    summary: '10+ years specializing in CI/CD pipeline modernization, Kubernetes orchestration, platform engineering, and high-availability infrastructure optimization.',
    yearsExperience: 10,
    primarySkills: [
      'Kubernetes & Helm',
      'Terraform & Ansible',
      'AWS / GCP / Azure',
      'CI/CD (GitHub Actions, GitLab)',
      'Datadog / Prometheus / Grafana',
      'Linux Kernel & Network Security'
    ],
    secondarySkills: [
      'Python scripting',
      'Go',
      'Docker & Containerd',
      'Cost Optimization',
      'Disaster Recovery'
    ],
    industries: ['Logistics & Supply Chain', 'Fintech', 'Digital Media'],
    certifications: [
      'Certified Kubernetes Administrator (CKA)',
      'AWS Certified DevOps Engineer – Professional'
    ],
    pastProjects: [
      {
        id: 'proj-sre-1',
        name: 'Zero-Downtime Multi-Region Kubernetes Migration',
        clientIndustry: 'Fintech',
        technologies: ['Kubernetes', 'Terraform', 'AWS', 'Datadog'],
        description: 'Migrated 40+ microservices to active-active multi-region Kubernetes clusters.',
        outcomes: 'Achieved 99.995% uptime and reduced deployment cycle time from 2 hours to 8 minutes.',
        durationMonths: 8
      }
    ],
    preferences: {
      minHourlyRateUsd: 175,
      preferredContractTypes: ['Time & Materials (T&M)', 'Fixed-Scope Delivery'],
      maxTravelPercent: 20,
      remoteOnly: false,
      excludedIndustries: ['Gambling'],
      securityClearance: 'public_trust',
      preferredRoleTypes: ['Hands-on Infrastructure Lead', 'SRE Advisory']
    }
  }
];

export const DEFAULT_ACTIVE_PROFILE = DEFAULT_PROFILES[0];
