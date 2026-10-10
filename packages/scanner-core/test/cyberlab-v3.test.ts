import { describe, it, expect } from 'vitest';
import { validateAndPreflightUrl } from '../src/cyberlab-v3-preflight';
import { auditSecurityTxt } from '../src/security-txt-parser';
import { generateAiFixMasterPrompt } from '../src/ai-fix-prompt-generator';
import { CyberLabV3Orchestrator } from '../src/cyberlab-v3-orchestrator';

describe('DevSphere CyberLab V3 Suite', () => {
  it('handles invalid or empty URLs with descriptive errors', async () => {
    const emptyResult = await validateAndPreflightUrl('');
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.errorCode).toBe('INVALID_URL');
    expect(emptyResult.errorMessage).toContain('valid');

    const invalidHostResult = await validateAndPreflightUrl('https://thisdomainwillneverexist12345xyz9999.org');
    expect(invalidHostResult.isValid).toBe(false);
    expect(invalidHostResult.errorCode).toBe('DOMAIN_NOT_FOUND');
  });

  it('validates reachable URLs safely with redirect tracking', async () => {
    const result = await validateAndPreflightUrl('example.com');
    expect(result.isValid).toBe(true);
    expect(result.normalizedUrl).toContain('https://example.com');
    expect(result.hostname).toBe('example.com');
    expect(result.statusCode).toBe(200);
    expect(result.redirectChain.length).toBeGreaterThanOrEqual(1);
  }, 25000);

  it('generates an evidence-grounded AI Website Fix Master Prompt', () => {
    const prompt = generateAiFixMasterPrompt({
      targetUrl: 'https://example.com',
      framework: 'Next.js',
      preflight: {
        isValid: true,
        normalizedUrl: 'https://example.com',
        originalInput: 'example.com',
        hostname: 'example.com',
        tlsValid: true,
        isParkedDomain: false,
        isSpaFallback: false,
        statusCode: 200,
        redirectChain: ['https://example.com'],
      },
      findings: [
        {
          id: 'SEC-001',
          ruleId: 'SEC_CSP_MISSING',
          category: 'security_headers',
          severity: 'high',
          confidence: 'confirmed',
          title: 'Missing Content-Security-Policy',
          description: 'No Content-Security-Policy header detected on response.',
          scoreDeduction: 15,
          evidence: { header: 'content-security-policy', value: null },
          explanation: 'CSP header protects against reflected and DOM-based Cross-Site Scripting.',
          potentialImpact: 'Possibility of malicious script execution.',
          remediation: 'Configure Content-Security-Policy with strict nonces.',
          snippets: [],
          standards: [],
          verificationSteps: ['Check curl -I response headers.'],
        },
      ],
      functional: {
        pagesTested: 5,
        brokenLinksCount: 1,
        missingAssetsCount: 0,
        consoleErrorsCount: 0,
        soft404Count: 0,
        horizontalOverflowDetected: false,
        issues: [
          {
            id: 'FUNC_01',
            type: 'broken_link',
            severity: 'high',
            url: 'https://example.com/broken',
            message: '404 on internal link',
            evidence: { statusCode: 404 },
          },
        ],
      },
      discoveredPages: [
        {
          url: 'https://example.com',
          path: '/',
          title: 'Example',
          statusCode: 200,
          discoverySource: 'homepage',
          loadTimeMs: 100,
          isBroken: false,
        },
      ],
      performanceMetrics: {
        fcpMs: 800,
        lcpMs: 1200,
        clsScore: 0.01,
        ttfbMs: 150,
      },
    });

    expect(prompt).toContain('DEVSPHERE CYBERLAB V3 — AI WEBSITE REPAIR MASTER PROMPT');
    expect(prompt).toContain('https://example.com');
    expect(prompt).toContain('Missing Content-Security-Policy');
    expect(prompt).toContain('404 on internal link');
    expect(prompt).toContain('Preserve All Working Features');
  });

  it('runs autonomous lab pipeline and produces complete CyberLabV3Run', async () => {
    const orchestrator = new CyberLabV3Orchestrator();
    const run = await orchestrator.runAutonomousLab('https://example.com');

    expect(run.id).toBeDefined();
    expect(run.state).toBe('COMPLETED');
    expect(run.progressPercent).toBe(100);
    expect(run.snapshot.title).toBeDefined();
    expect(run.discoveredPages.length).toBeGreaterThanOrEqual(1);
    expect(run.performanceMetrics.fcpMs).toBeGreaterThan(0);
    expect(run.aiFixMasterPrompt).toBeDefined();
    expect(run.aiFixMasterPrompt.length).toBeGreaterThan(200);
  }, 25000);
});
