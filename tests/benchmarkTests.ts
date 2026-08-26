/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Benchmark & Automated Test Suite for Consultant-in-a-Box
 * Evaluates the 3 canonical RFPs against the default consultant profile:
 * 1. Cloud & GenAI Modernization -> Expected: GO
 * 2. Healthcare Legacy ERP Migration -> Expected: REVIEW
 * 3. COBOL Mainframe Maintenance -> Expected: PASS
 */

import { OpportunityAgentOrchestrator } from '../src/agent/orchestrator.ts';
import { DEFAULT_ACTIVE_PROFILE } from '../src/data/defaultProfiles.ts';
import { SAMPLE_RFPS } from '../src/data/sampleRFPs.ts';
import { OpportunityEvaluationReport } from '../src/types/agent.ts';

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  score?: number;
  details: string;
  durationMs: number;
}

export async function runAllBenchmarks(): Promise<{ results: TestResult[]; allPassed: boolean }> {
  console.log('\n===============================================================');
  console.log('🤖 RUNNING CONSULTANT-IN-A-BOX AUTOMATED BENCHMARK SUITE');
  console.log('===============================================================\n');

  const orchestrator = new OpportunityAgentOrchestrator();
  const results: TestResult[] = [];

  // Test 1: Canonical RFP 1 - Cloud & GenAI Architecture (Expected: GO)
  const rfp1 = SAMPLE_RFPS.find((r) => r.expectedOutcome === 'GO') || SAMPLE_RFPS[0];
  console.log(`[Test 1] Evaluating Canonical RFP: "${rfp1.title}" (Expected: GO)...`);
  const t1Start = Date.now();
  try {
    const report1: OpportunityEvaluationReport = await orchestrator.evaluateOpportunity(
      rfp1.content,
      DEFAULT_ACTIVE_PROFILE
    );
    const duration1 = Date.now() - t1Start;
    const passed1 = report1.recommendation.decision === 'GO' && report1.recommendation.opportunityScore >= 70;
    
    results.push({
      name: 'Canonical RFP 1: High Fit GenAI Modernization',
      passed: passed1,
      expected: 'GO (Score >= 70)',
      actual: `${report1.recommendation.decision} (Score: ${report1.recommendation.opportunityScore}/100, Confidence: ${report1.recommendation.confidence})`,
      score: report1.recommendation.opportunityScore,
      details: `Extracted ${report1.extraction.requirements.length} reqs, ${report1.fitAssessment.strongMatches.length} strong matches, ${report1.riskAssessment.identifiedRisks.length} risks. Rationale: ${report1.recommendation.headline}`,
      durationMs: duration1,
    });
    console.log(`  -> Result: ${passed1 ? '✅ PASSED' : '❌ FAILED'} in ${duration1}ms\n`);
  } catch (err: any) {
    results.push({
      name: 'Canonical RFP 1: High Fit GenAI Modernization',
      passed: false,
      expected: 'GO',
      actual: `ERROR: ${err.message}`,
      details: err.stack || '',
      durationMs: Date.now() - t1Start,
    });
    console.error(`  -> Failed with error: ${err.message}\n`);
  }

  // Test 2: Canonical RFP 2 - Legacy ERP Integration (Expected: REVIEW)
  const rfp2 = SAMPLE_RFPS.find((r) => r.expectedOutcome === 'REVIEW') || SAMPLE_RFPS[1];
  console.log(`[Test 2] Evaluating Canonical RFP: "${rfp2.title}" (Expected: REVIEW)...`);
  const t2Start = Date.now();
  try {
    const report2: OpportunityEvaluationReport = await orchestrator.evaluateOpportunity(
      rfp2.content,
      DEFAULT_ACTIVE_PROFILE
    );
    const duration2 = Date.now() - t2Start;
    const passed2 =
      report2.recommendation.decision === 'REVIEW' ||
      (report2.recommendation.opportunityScore >= 45 && report2.recommendation.opportunityScore <= 75);

    results.push({
      name: 'Canonical RFP 2: Mixed Fit Legacy ERP',
      passed: passed2,
      expected: 'REVIEW (Score 45-75)',
      actual: `${report2.recommendation.decision} (Score: ${report2.recommendation.opportunityScore}/100, Confidence: ${report2.recommendation.confidence})`,
      score: report2.recommendation.opportunityScore,
      details: `Identified ${report2.fitAssessment.partialMatches.length} partial matches, ${report2.fitAssessment.gaps.length} gaps. Critical gaps: ${report2.recommendation.criticalGaps.join('; ')}`,
      durationMs: duration2,
    });
    console.log(`  -> Result: ${passed2 ? '✅ PASSED' : '❌ FAILED'} in ${duration2}ms\n`);
  } catch (err: any) {
    results.push({
      name: 'Canonical RFP 2: Mixed Fit Legacy ERP',
      passed: false,
      expected: 'REVIEW',
      actual: `ERROR: ${err.message}`,
      details: err.stack || '',
      durationMs: Date.now() - t2Start,
    });
    console.error(`  -> Failed with error: ${err.message}\n`);
  }

  // Test 3: Canonical RFP 3 - Legacy Mainframe COBOL (Expected: PASS)
  const rfp3 = SAMPLE_RFPS.find((r) => r.expectedOutcome === 'PASS') || SAMPLE_RFPS[2];
  console.log(`[Test 3] Evaluating Canonical RFP: "${rfp3.title}" (Expected: PASS)...`);
  const t3Start = Date.now();
  try {
    const report3: OpportunityEvaluationReport = await orchestrator.evaluateOpportunity(
      rfp3.content,
      DEFAULT_ACTIVE_PROFILE
    );
    const duration3 = Date.now() - t3Start;
    const passed3 = report3.recommendation.decision === 'PASS' && report3.recommendation.opportunityScore < 50;

    results.push({
      name: 'Canonical RFP 3: Poor Fit COBOL Mainframe',
      passed: passed3,
      expected: 'PASS (Score < 50)',
      actual: `${report3.recommendation.decision} (Score: ${report3.recommendation.opportunityScore}/100, Confidence: ${report3.recommendation.confidence})`,
      score: report3.recommendation.opportunityScore,
      details: `Identified ${report3.fitAssessment.disqualifiers.length} disqualifiers, ${report3.fitAssessment.gaps.length} gaps. Primary risks: ${report3.recommendation.primaryRisks.join('; ')}`,
      durationMs: duration3,
    });
    console.log(`  -> Result: ${passed3 ? '✅ PASSED' : '❌ FAILED'} in ${duration3}ms\n`);
  } catch (err: any) {
    results.push({
      name: 'Canonical RFP 3: Poor Fit COBOL Mainframe',
      passed: false,
      expected: 'PASS',
      actual: `ERROR: ${err.message}`,
      details: err.stack || '',
      durationMs: Date.now() - t3Start,
    });
    console.error(`  -> Failed with error: ${err.message}\n`);
  }

  // Test 4: Graceful Error Handling on Empty Input
  console.log('[Test 4] Evaluating Edge Case: Empty Input Handling...');
  const t4Start = Date.now();
  try {
    await orchestrator.evaluateOpportunity('', DEFAULT_ACTIVE_PROFILE);
    results.push({
      name: 'Edge Case: Empty Input Rejection',
      passed: false,
      expected: 'Should reject empty document',
      actual: 'Unexpected success with empty input',
      details: 'Orchestrator did not throw on empty text',
      durationMs: Date.now() - t4Start,
    });
  } catch (err: any) {
    const passed4 = true;
    results.push({
      name: 'Edge Case: Empty Input Rejection',
      passed: passed4,
      expected: 'Error / Rejection',
      actual: `Rejected cleanly: ${err.message}`,
      details: 'Handled gracefully without crashing',
      durationMs: Date.now() - t4Start,
    });
    console.log(`  -> Result: ✅ PASSED (Rejected gracefully: ${err.message})\n`);
  }

  // Summary Table
  console.log('===============================================================');
  console.log('📊 TEST SUMMARY & SCORE MATRIX');
  console.log('===============================================================');
  results.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
    console.log(`   Expected: ${r.expected}`);
    console.log(`   Actual:   ${r.actual}`);
    console.log(`   Duration: ${r.durationMs}ms`);
    console.log(`   Details:  ${r.details}\n`);
  });

  const allPassed = results.every((r) => r.passed);
  console.log(`OVERALL STATUS: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  console.log('===============================================================\n');

  return { results, allPassed };
}

// Allow direct execution via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllBenchmarks()
    .then(({ allPassed }) => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal benchmark error:', err);
      process.exit(1);
    });
}
