import { describe, it, expect } from 'vitest';
import {
  CyberLabEngine,
  CyberLabV3Orchestrator,
  AutoFixVerificationEngine,
  generateAiFixMasterPrompt,
} from '../src/index';
import type { CyberLabV3Run } from '@devsphere/shared';

describe('DevSphere CyberLab — Comprehensive Feature Recovery & Contract Verification', () => {
  const labEngine = new CyberLabEngine();
  const v3Orchestrator = new CyberLabV3Orchestrator();
  const verificationEngine = new AutoFixVerificationEngine();

  describe('1. Legacy Traffic Simulator Contract', () => {
    it('executes stepped virtual user loads (10 to 1,000 VUs) with circuit breaker controls', () => {
      // 10 VUs
      const sim10 = labEngine.simulateMockTraffic({
        vus: 10,
        durationSec: 10,
        targetEndpoint: '/',
        circuitBreakerLatencyMs: 3000,
        circuitBreakerErrorRatePercent: 50,
      });

      expect(sim10.isSynthetic).toBe(true);
      expect(sim10.vus).toBe(10);
      expect(sim10.durationSec).toBe(10);
      expect(sim10.totalRequests).toBeGreaterThan(0);
      expect(sim10.requestsPerSecond).toBeGreaterThan(0);
      expect(sim10.latency.p50).toBeGreaterThan(0);
      expect(sim10.latency.p95).toBeGreaterThanOrEqual(sim10.latency.p50);
      expect(sim10.timeSeries.length).toBe(10);
      expect(sim10.circuitBreakerTriggered).toBe(false);

      // 500 VUs
      const sim500 = labEngine.simulateMockTraffic({
        vus: 500,
        durationSec: 15,
        targetEndpoint: '/api/v1/search',
        circuitBreakerLatencyMs: 2500,
        circuitBreakerErrorRatePercent: 40,
      });

      expect(sim500.vus).toBe(500);
      expect(sim500.totalRequests).toBeGreaterThan(sim10.totalRequests);

      // Low threshold triggers circuit breaker safety cutoff
      const simBreaker = labEngine.simulateMockTraffic({
        vus: 1000,
        durationSec: 10,
        targetEndpoint: '/checkout',
        circuitBreakerLatencyMs: 40,
        circuitBreakerErrorRatePercent: 20,
      });

      expect(simBreaker.circuitBreakerTriggered).toBe(true);
      expect(simBreaker.circuitBreakerReason).toBeDefined();
    });
  });

  describe('2. Legacy Chaos Injector Contract', () => {
    it('simulates infrastructure faults, timeout drops, and evaluates resilience', () => {
      // Database latency
      const dbLatency = labEngine.injectFault({
        faultType: 'db_latency',
        latencyMs: 1500,
        failureRatePercent: 100,
        durationSec: 15,
      });

      expect(dbLatency.faultType).toBe('db_latency');
      expect(dbLatency.resilienceScore).toBeGreaterThan(0);
      expect(dbLatency.gracefulDegradation).toBe(true);
      expect(dbLatency.recommendations.length).toBeGreaterThan(0);

      // Database connection refusal
      const dbRefusal = labEngine.injectFault({
        faultType: 'db_connection_refusal',
        latencyMs: 500,
        failureRatePercent: 100,
        durationSec: 10,
      });

      expect(dbRefusal.status).toBe('circuit_broken');
      expect(dbRefusal.observedBehavior).toContain('ECONNREFUSED');

      // Cache service down
      const cacheDrop = labEngine.injectFault({
        faultType: 'cache_service_down',
        latencyMs: 800,
        failureRatePercent: 100,
        durationSec: 10,
      });

      expect(cacheDrop.faultType).toBe('cache_service_down');
      expect(cacheDrop.recommendations).toBeDefined();

      // Upstream 503 outage
      const upstream503 = labEngine.injectFault({
        faultType: 'upstream_503',
        failureRatePercent: 100,
        durationSec: 10,
      });

      expect(upstream503.faultType).toBe('upstream_503');
      expect(upstream503.gracefulDegradation).toBe(true);
    });
  });

  describe('3. Defensive Security Simulation Engine Contract', () => {
    it('produces categorized defensive vulnerability findings with evidence', () => {
      const findings = labEngine.runSandboxSecuritySimulation();

      expect(findings.length).toBeGreaterThanOrEqual(5);

      const categories = findings.map((f) => f.category);
      expect(categories).toContain('xss_defense');
      expect(categories).toContain('csrf_protection');
      expect(categories).toContain('injection_defense');

      const finding = findings[0];
      expect(finding.id).toBeDefined();
      expect(finding.isSandboxSimulation).toBe(true);
      expect(finding.evidence).toBeDefined();
      expect(finding.verificationSteps.length).toBeGreaterThan(0);
    });
  });

  describe('4. AI Remediation Workspace Contract', () => {
    it('generates framework-tailored code patches and verification procedures', () => {
      const findings = labEngine.runSandboxSecuritySimulation();
      const xssFinding = findings.find((f) => f.category === 'xss_defense')!;

      // Next.js framework patch
      const nextPatch = labEngine.generateAiRemediation(xssFinding, 'nextjs');
      expect(nextPatch.framework).toBe('nextjs');
      expect(nextPatch.suggestedPatch.patchedSnippet).toBeDefined();
      expect(nextPatch.verificationTest).toBeDefined();

      // Express framework patch
      const expressPatch = labEngine.generateAiRemediation(xssFinding, 'express');
      expect(expressPatch.framework).toBe('express');
      expect(expressPatch.suggestedPatch.patchedSnippet).toBeDefined();
    });
  });

  describe('5. CyberLab V3 Autonomous Scanner & Remediation Contract', () => {
    it('orchestrates autonomous scan execution and generates master AI prompt', async () => {
      const run = await v3Orchestrator.runAutonomousLab('https://example.com', false);

      expect(run.state).toBe('COMPLETED');
      expect(run.progressPercent).toBe(100);
      expect(run.preflight.isValid).toBe(true);
      expect(run.discoveredPages.length).toBeGreaterThan(0);
      expect(run.performanceMetrics.fcpMs).toBeGreaterThan(0);
      expect(run.aiFixMasterPrompt).toBeDefined();
      expect(run.aiFixMasterPrompt.length).toBeGreaterThan(500);
    }, 25000);
  });

  describe('6. Auto-Fix Verification Engine Contract', () => {
    it('performs deterministic before/after comparison and detects regressions', () => {
      const mockBaseline: CyberLabV3Run = {
        id: 'run_baseline_1',
        targetUrl: 'https://example.com',
        normalizedUrl: 'https://example.com',
        state: 'COMPLETED',
        progressPercent: 100,
        currentStepTitle: 'Done',
        currentStepDetail: 'Completed',
        startedAt: new Date().toISOString(),
        preflight: {
          isValid: true,
          normalizedUrl: 'https://example.com',
          originalInput: 'https://example.com',
          hostname: 'example.com',
          tlsValid: true,
          isParkedDomain: false,
          isSpaFallback: false,
          redirectChain: [],
        },
        snapshot: {
          url: 'https://example.com',
          title: 'Example Domain',
          domStructure: { title: 'Example', metaTags: {}, headers: [], links: [], forms: [], buttons: [], scripts: [], stylesheets: [], images: [] },
          networkResources: [],
          syntheticApis: [],
          viewportMetrics: { desktop: { width: 1440, height: 900, layoutShiftScore: 0 }, tablet: { width: 768, height: 1024, layoutShiftScore: 0 }, mobile: { width: 375, height: 667, layoutShiftScore: 0 } },
          securityHeaders: {},
          observedAt: new Date().toISOString(),
          disclaimer: 'Mock',
        },
        discoveredPages: [
          { url: 'https://example.com/', path: '/', statusCode: 200, isBroken: false, loadTimeMs: 120, discoverySource: 'crawl', testedSelectors: [] },
          { url: 'https://example.com/docs', path: '/docs', statusCode: 200, isBroken: false, loadTimeMs: 150, discoverySource: 'crawl', testedSelectors: [] },
        ],
        functional: { pagesTested: 2, brokenLinksCount: 0, missingAssetsCount: 0, consoleErrorsCount: 0, soft404Count: 0, horizontalOverflowDetected: false, issues: [] },
        performanceMetrics: { fcpMs: 800, lcpMs: 1400, clsScore: 0.02, ttfbMs: 150, tbtMs: 50, speedIndexMs: 900, transferSizeBytes: 50000, requestCount: 10, renderBlockingResources: 0, domContentLoadedMs: 400 },
        securityAudit: { tlsGrade: 'A', certificateExpiresDays: 90, httpsEnforced: true, hstsPresent: false, cspStrictness: 'missing', securityTxt: { present: false, rfc9116Valid: false, issues: [] }, headersScore: 65 },
        findings: [
          {
            id: 'find_hsts',
            ruleId: 'SEC_HEADER_HSTS',
            category: 'headers',
            severity: 'high',
            title: 'Missing HSTS Header',
            description: 'Strict-Transport-Security header is not configured.',
            remediation: 'Configure HSTS with max-age.',
            evidence: { header: 'strict-transport-security', value: null },
            confidence: 'confirmed',
          },
        ],
        evidenceLog: [],
        aiFixMasterPrompt: '# BASELINE PROMPT',
      };

      // Verified Re-Scan: HSTS is fixed, but /docs is newly broken (regression)
      const mockVerified: CyberLabV3Run = {
        ...mockBaseline,
        id: 'run_verified_2',
        discoveredPages: [
          { url: 'https://example.com/', path: '/', statusCode: 200, isBroken: false, loadTimeMs: 110, discoverySource: 'crawl', testedSelectors: [] },
          { url: 'https://example.com/docs', path: '/docs', statusCode: 404, isBroken: true, loadTimeMs: 180, discoverySource: 'crawl', testedSelectors: [] },
        ],
        securityAudit: {
          ...mockBaseline.securityAudit,
          hstsPresent: true,
          headersScore: 90,
        },
        findings: [], // HSTS finding resolved!
      };

      const comparison = verificationEngine.compareRuns(mockBaseline, mockVerified);

      expect(comparison.summary.verifiedFixedCount).toBe(1);
      expect(comparison.findingComparisons[0].status).toBe('VERIFIED_FIXED');
      expect(comparison.summary.regressionsCount).toBe(1);
      expect(comparison.functionalRegressions[0].type).toBe('broken_link');
      expect(comparison.summary.overallVerdict).toBe('REGRESSIONS_DETECTED');
    });
  });
});
