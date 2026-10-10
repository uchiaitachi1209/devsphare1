import {
  ScanMode,
  ScanResult,
  ScanSummaryItem,
  ScanFilterInput,
  ScanFinding,
} from '@devsphere/shared';


const API_BASE =
  typeof window === 'undefined' && process.env.API_URL
    ? `${process.env.API_URL.replace(/\/$/, '')}/api/v1`
    : '/api/v1';

export async function createScan(
  url: string,
  mode: ScanMode = 'public',
  maxPages: number = 10,
  loadTestVUs?: number
): Promise<{ scanId: string; message: string }> {
  const res = await fetch(`${API_BASE}/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, mode, maxPages, loadTestVUs }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to start scan');
  }

  return res.json();
}

export async function getDomainVerificationToken(domain: string): Promise<{
  domain: string;
  token: string;
  dnsTxtRecord: { host: string; type: string; value: string };
  metaTag: { name: string; content: string };
}> {
  const res = await fetch(`${API_BASE}/domains/token?domain=${encodeURIComponent(domain)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch domain verification token');
  }
  return res.json();
}

export async function verifyDomainOwnership(
  domain: string,
  method: 'dns_txt' | 'meta_tag' = 'dns_txt'
): Promise<{ success: boolean; message: string; record?: any }> {
  const res = await fetch(`${API_BASE}/domains/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, method }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Verification failed');
  }
  return res.json();
}

export async function listVerifiedDomains(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/domains`);
  if (!res.ok) {
    return [];
  }
  return res.json();
}


export async function getScan(id: string): Promise<ScanResult> {
  const res = await fetch(`${API_BASE}/scans/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch scan with ID: ${id}`);
  }
  return res.json();
}

export async function listScans(filters: Partial<ScanFilterInput> = {}): Promise<{
  items: ScanSummaryItem[];
  total: number;
  limit: number;
  offset: number;
}> {
  const params = new URLSearchParams();
  if (filters.query) params.append('query', filters.query);
  if (filters.status) params.append('status', filters.status);
  if (filters.grade) params.append('grade', filters.grade);
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.offset) params.append('offset', String(filters.offset));
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const res = await fetch(`${API_BASE}/scans?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to retrieve scans list');
  }
  return res.json();
}

export async function getFindings(
  id: string,
  severity?: string
): Promise<{ scanId: string; totalFindings: number; findings: ScanFinding[] }> {
  const url = severity
    ? `${API_BASE}/scans/${id}/findings?severity=${severity}`
    : `${API_BASE}/scans/${id}/findings`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to retrieve findings');
  }
  return res.json();
}

export async function getReport(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/scans/${id}/report`);
  if (!res.ok) {
    throw new Error('Failed to retrieve scan report');
  }
  return res.json();
}

export async function compareScans(scanA: string, scanB: string): Promise<any> {
  const res = await fetch(
    `${API_BASE}/scans/compare?scanA=${encodeURIComponent(scanA)}&scanB=${encodeURIComponent(scanB)}`
  );
  if (!res.ok) {
    throw new Error('Failed to compare scans');
  }
  return res.json();
}

export async function cancelScan(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/scans/${id}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to cancel scan');
  }
  return res.json();
}

export async function deleteScan(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/scans/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Failed to delete scan ${id}`);
  }
  return res.json();
}

export async function clearScanHistory(ids?: string[]): Promise<{
  success: boolean;
  message: string;
  deletedCount: number;
}> {
  const isAll = !ids || ids.length === 0;
  const res = await fetch(`${API_BASE}/scans${isAll ? '?all=true' : ''}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: isAll ? JSON.stringify({ all: true }) : JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Failed to clear scan history');
  }
  return res.json();
}

// ==========================================
// DEVSPHERE CYBERLAB CLIENT METHODS
// ==========================================

import type {
  CyberLabSession,
  CreateCyberLabSessionInput,
  SimulateTrafficInput,
  TrafficSimulationResult,
  InjectFaultInput,
  FaultInjectionResult,
  SandboxSecurityFinding,
  AiRemediationPlan,
} from '@devsphere/shared';

export async function createCyberLabSession(
  input: CreateCyberLabSessionInput
): Promise<CyberLabSession> {
  const res = await fetch(`${API_BASE}/cyberlab/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to create CyberLab session');
  }
  return res.json();
}

export async function listCyberLabSessions(): Promise<CyberLabSession[]> {
  const res = await fetch(`${API_BASE}/cyberlab/sessions`);
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function getCyberLabSession(id: string): Promise<CyberLabSession> {
  const res = await fetch(`${API_BASE}/cyberlab/sessions/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to load CyberLab session: ${id}`);
  }
  return res.json();
}

export async function deleteCyberLabSession(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/cyberlab/sessions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to destroy CyberLab session');
  }
  return res.json();
}

export async function clearAllCyberLabSessions(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/cyberlab/sessions`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to clear CyberLab sessions');
  }
  return res.json();
}

export async function simulateCyberLabTraffic(
  sessionId: string,
  input: SimulateTrafficInput
): Promise<TrafficSimulationResult> {
  const res = await fetch(`${API_BASE}/cyberlab/sessions/${sessionId}/simulate-traffic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to simulate mock traffic');
  }
  return res.json();
}

export async function injectCyberLabFault(
  sessionId: string,
  input: InjectFaultInput
): Promise<FaultInjectionResult> {
  const res = await fetch(`${API_BASE}/cyberlab/sessions/${sessionId}/inject-fault`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to inject infrastructure fault');
  }
  return res.json();
}

export async function runCyberLabSecuritySim(
  sessionId: string,
  categories?: string[]
): Promise<SandboxSecurityFinding[]> {
  const res = await fetch(`${API_BASE}/cyberlab/sessions/${sessionId}/security-simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categories }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to execute security simulation');
  }
  return res.json();
}

export async function generateCyberLabAiRemediation(
  sessionId: string,
  findingId: string,
  framework?: string
): Promise<AiRemediationPlan> {
  const res = await fetch(`${API_BASE}/cyberlab/sessions/${sessionId}/ai-remediation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ findingId, framework }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to generate AI remediation plan');
  }
  return res.json();
}

// ==========================================
// CYBERLAB V3 AUTONOMOUS ENGINE METHODS
// ==========================================

import type { CyberLabV3Run } from '@devsphere/shared';

export async function startCyberLabV3Run(
  url: string,
  isVerifiedOwner: boolean = false
): Promise<{ runId: string; message: string; run: CyberLabV3Run }> {
  const res = await fetch(`${API_BASE}/cyberlab/v3/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, isVerifiedOwner }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to start CyberLab V3 execution');
  }
  return res.json();
}

export async function getCyberLabV3Run(id: string): Promise<CyberLabV3Run> {
  const res = await fetch(`${API_BASE}/cyberlab/v3/runs/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to load CyberLab V3 run: ${id}`);
  }
  return res.json();
}

export async function cancelCyberLabV3Run(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/cyberlab/v3/runs/${id}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to cancel CyberLab V3 run');
  }
  return res.json();
}

export async function getCyberLabV3FixPrompt(id: string): Promise<{ prompt: string }> {
  const res = await fetch(`${API_BASE}/cyberlab/v3/runs/${id}/fix-prompt`);
  if (!res.ok) {
    throw new Error('Failed to load AI fix prompt');
  }
  return res.json();
}

// ==========================================
// AUTO-FIX VERIFICATION CLIENT METHODS
// ==========================================

import type { VerificationSession } from '@devsphere/shared';

export async function createVerificationSession(
  runId: string
): Promise<VerificationSession> {
  const res = await fetch(`${API_BASE}/cyberlab/verification/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to initialize verification session');
  }
  return res.json();
}

export async function listVerificationSessions(): Promise<VerificationSession[]> {
  const res = await fetch(`${API_BASE}/cyberlab/verification/sessions`);
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function getVerificationSession(id: string): Promise<VerificationSession> {
  const res = await fetch(`${API_BASE}/cyberlab/verification/sessions/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to load verification session: ${id}`);
  }
  return res.json();
}

export async function triggerVerification(
  sessionId: string,
  notes?: string,
  commitSha?: string
): Promise<VerificationSession> {
  const res = await fetch(`${API_BASE}/cyberlab/verification/sessions/${sessionId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, commitSha }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to execute verification re-scan');
  }
  return res.json();
}

