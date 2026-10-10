'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FlaskConical,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  FileCode,
  FileText,
  Globe,
  GitBranch,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  getVerificationSession,
  triggerVerification,
} from '@/lib/api-client';
import type {
  VerificationSession,
  FindingComparisonItem,
  FunctionalRegressionItem,
  VerificationFindingStatus,
} from '@devsphere/shared';

export default function VerificationSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<VerificationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | VerificationFindingStatus>('ALL');
  const [activeTab, setActiveTab] = useState<'matrix' | 'performance' | 'regressions' | 'prompt' | 'cicd'>('matrix');

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await getVerificationSession(sessionId);
      setSession(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load verification session.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleTriggerReVerification = async () => {
    if (!sessionId) return;
    try {
      setVerifying(true);
      setErrorMsg(null);
      const updated = await triggerVerification(sessionId, 'Manual user retest');
      setSession(updated);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Re-verification failed. Ensure target website is accessible.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyPrompt = () => {
    const promptText = session?.updatedAiFixPrompt || session?.baselineRun?.aiFixMasterPrompt;
    if (!promptText) return;
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownloadPrompt = () => {
    const promptText = session?.updatedAiFixPrompt || session?.baselineRun?.aiFixMasterPrompt;
    if (!promptText) return;
    const blob = new Blob([promptText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DEVSPHERE_UPDATED_FIX_PROMPT_${sessionId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadComparisonJson = () => {
    if (!session) return;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DEVSPHERE_VERIFICATION_COMPARISON_${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Loading Auto-Fix Verification Session...</p>
      </div>
    );
  }

  if (errorMsg && !session) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-4">
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <AlertTriangle className="w-5 h-5" />
            <span>Verification Session Error</span>
          </div>
          <p className="text-sm">{errorMsg}</p>
          <div className="pt-2">
            <Link
              href="/cyberlab"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to CyberLab V3
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const baseline = session.baselineRun;
  const latest = session.latestRun;
  const summary = session.summary;
  const findingComparisons = session.findingComparisons || [];
  const performanceComparison = session.performanceComparison;
  const functionalRegressions = session.functionalRegressions || [];

  // Filter finding items
  const filteredFindings = findingComparisons.filter((item: FindingComparisonItem) => {
    if (selectedStatusFilter === 'ALL') return true;
    return item.status === selectedStatusFilter;
  });

  // Recharts metric data
  const performanceChartData = performanceComparison
    ? [
        {
          metric: 'FCP (ms)',
          Baseline: baseline.performanceMetrics.fcpMs,
          Verified: latest ? latest.performanceMetrics.fcpMs : 0,
        },
        {
          metric: 'LCP (ms)',
          Baseline: baseline.performanceMetrics.lcpMs,
          Verified: latest ? latest.performanceMetrics.lcpMs : 0,
        },
        {
          metric: 'TTFB (ms)',
          Baseline: baseline.performanceMetrics.ttfbMs,
          Verified: latest ? latest.performanceMetrics.ttfbMs : 0,
        },
      ]
    : [];

  const getVerdictBadge = () => {
    switch (summary.overallVerdict) {
      case 'PASS_CLEAN':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            VERIFIED PASS • ZERO REGRESSIONS
          </span>
        );
      case 'PASS_IMPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASS • IMPROVED POSTURE
          </span>
        );
      case 'REGRESSIONS_DETECTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/40">
            <ShieldAlert className="w-3.5 h-3.5" />
            REGRESSIONS DETECTED
          </span>
        );
      case 'PARTIAL_FIX':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Activity className="w-3.5 h-3.5" />
            PARTIAL FIX • PROGRESS VERIFIED
          </span>
        );
      case 'NO_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            NO CHANGE OBSERVED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono bg-blue-500/20 text-blue-400 border border-blue-500/40">
            <Clock className="w-3.5 h-3.5" />
            AWAITING POST-FIX VERIFICATION
          </span>
        );
    }
  };

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in print:p-0 print:max-w-full">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4 text-xs font-mono text-slate-400 print:hidden">
        <div className="flex items-center gap-2">
          <Link href="/cyberlab" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            CyberLab V3
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-white">Auto-Fix Verification Engine</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-cyan-400 truncate max-w-[200px]">{session.id}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/cyberlab/verify"
            className="hover:text-cyan-400 text-xs font-mono text-slate-400 transition-colors flex items-center gap-1"
          >
            All Verification Sessions
          </Link>
        </div>
      </div>

      {/* Top Banner: Verification Engine Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#0a1020] to-slate-950 border border-cyan-500/20 shadow-2xl space-y-5 print:border-none print:shadow-none print:p-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase">
                CYBERLAB V3 • AUTO-FIX VERIFICATION
              </span>
              {getVerdictBadge()}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-cyan-400 shrink-0" />
              DevSphere Fix Verification
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2 font-mono flex-wrap">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white font-semibold">{session.targetUrl}</span>
              <span className="text-slate-600">•</span>
              <span>Baseline: {new Date(baseline.startedAt).toLocaleString()}</span>
              {latest && (
                <>
                  <span className="text-slate-600">•</span>
                  <span>Verified: {new Date(latest.startedAt).toLocaleString()}</span>
                </>
              )}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0 print:hidden">
            <button
              type="button"
              onClick={handleTriggerReVerification}
              disabled={verifying}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 shadow-lg ${
                verifying
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20 hover:shadow-cyan-500/40'
              }`}
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Scanning & Verifying Fixes...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>{session.status === 'awaiting_deployment' ? "I've Deployed My Fixes" : 'Verify Again'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5 border border-white/5"
              title="Print or Export PDF Report"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPrompt}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5 border border-white/5"
              title="Download Updated Fix Prompt (.md)"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Prompt (.md)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyPrompt}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5 border border-white/5"
            >
              {copiedPrompt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPrompt ? 'Copied' : 'Copy Prompt'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadComparisonJson}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5 border border-white/5"
              title="Download Comparison JSON"
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block text-red-300">Verification Failure:</strong>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Top Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Verified Fixed</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {summary.verifiedFixedCount}
              </span>
              <span className="text-xs text-slate-500">issues resolved</span>
            </div>
            <p className="text-[10px] text-emerald-400/80 font-mono">Evidence-backed resolution</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Regressions</span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-black font-mono ${
                  summary.regressionsCount > 0 ? 'text-red-400' : 'text-slate-400'
                }`}
              >
                {summary.regressionsCount}
              </span>
              <span className="text-xs text-slate-500">new defects</span>
            </div>
            <p className="text-[10px] text-red-400/80 font-mono">
              {summary.regressionsCount > 0 ? 'Action required immediately' : 'Zero regressions introduced'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Still Present</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {summary.stillPresentCount}
              </span>
              <span className="text-xs text-slate-500">unresolved</span>
            </div>
            <p className="text-[10px] text-amber-400/80 font-mono">Covered in updated prompt</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Posture Score &Delta;</span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-black font-mono ${
                  summary.scoreDelta > 0
                    ? 'text-emerald-400'
                    : summary.scoreDelta < 0
                    ? 'text-red-400'
                    : 'text-cyan-400'
                }`}
              >
                {summary.scoreDelta > 0 ? `+${summary.scoreDelta}` : summary.scoreDelta}
              </span>
              <span className="text-xs text-slate-500">pts</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Headers Score: {baseline.securityAudit?.headersScore || 100}/100
            </p>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN SIDE-BY-SIDE BEFORE / AFTER COMPARISON CANVAS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Before vs After Verification Matrix
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Immutable Baseline #{baseline.id.slice(-8)} vs {latest ? `Re-Scan #${latest.id.slice(-8)}` : 'Awaiting Re-Scan'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: BEFORE FIX (BASELINE) */}
          <div className="rounded-2xl bg-slate-950 border border-white/10 overflow-hidden shadow-xl flex flex-col">
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  BEFORE FIX (IMMUTABLE BASELINE)
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5 truncate">
                  Audit Snapshot • {baseline.normalizedUrl}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-black/40 px-2 py-1 rounded border border-white/5">
                {new Date(baseline.startedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {/* Snapshot Title & Metadata */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Page Title & Status</span>
                <p className="text-xs font-semibold text-white truncate">
                  {baseline.snapshot?.title || 'Initial Public Crawl'}
                </p>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>Pages: <strong className="text-white">{baseline.discoveredPages.length}</strong></span>
                  <span>
                    Console Errors:{' '}
                    <strong className={(baseline.functional?.consoleErrorsCount || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}>
                      {baseline.functional?.consoleErrorsCount || 0}
                    </strong>
                  </span>
                  <span>Broken Links: <strong className="text-white">{baseline.functional?.brokenLinksCount || 0}</strong></span>
                </div>
              </div>

              {/* Core Security Checklist Baseline */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase block">Security Standards</span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">TLS Cert:</span>
                    <span className="text-emerald-400 font-bold">{baseline.securityAudit.tlsGrade}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">HSTS:</span>
                    <span className={baseline.securityAudit.hstsPresent ? 'text-emerald-400' : 'text-amber-400 font-bold'}>
                      {baseline.securityAudit.hstsPresent ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">CSP Policy:</span>
                    <span className="text-cyan-400 font-bold capitalize">{baseline.securityAudit.cspStrictness}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">security.txt:</span>
                    <span className={baseline.securityAudit.securityTxt.rfc9116Valid ? 'text-emerald-400' : 'text-slate-400'}>
                      {baseline.securityAudit.securityTxt.rfc9116Valid ? 'Compliant' : 'Missing'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Core Web Vitals Baseline */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase block">Performance Metrics</span>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                  <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">FCP</span>
                    <span className="text-sm font-bold text-white">{baseline.performanceMetrics.fcpMs}ms</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">LCP</span>
                    <span className="text-sm font-bold text-white">{baseline.performanceMetrics.lcpMs}ms</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">CLS</span>
                    <span className="text-sm font-bold text-white">{baseline.performanceMetrics.clsScore.toFixed(3)}</span>
                  </div>
                </div>
              </div>

              {/* Baseline Findings Count by Severity */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase block">
                  Original Detected Issues ({baseline.findings.length})
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {['critical', 'high', 'medium', 'low', 'info'].map((sev) => {
                    const count = baseline.findings.filter((f) => f.severity === sev).length;
                    if (count === 0) return null;
                    return (
                      <span
                        key={sev}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono uppercase bg-slate-900/80 border border-white/5"
                      >
                        <span className="text-slate-400 mr-1.5">{sev}:</span>
                        <strong className="text-white">{count}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: AFTER FIX (VERIFIED RE-SCAN) */}
          <div className="rounded-2xl bg-slate-950 border border-cyan-500/20 overflow-hidden shadow-xl flex flex-col">
            <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border-b border-cyan-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  AFTER FIX (VERIFIED RE-SCAN)
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5 truncate">
                  {latest ? `Post-Fix Audit • Re-Scan #${latest.id.slice(-8)}` : 'Verification Pending Deployment'}
                </h3>
              </div>
              {latest && (
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-500/30">
                  {new Date(latest.startedAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="p-5 space-y-5 flex-1">
              {!latest ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <FlaskConical className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h4 className="text-base font-bold text-white">Awaiting Re-Verification</h4>
                    <p className="text-xs text-slate-400">
                      Apply the fixes from your Master Prompt to your website, deploy the changes, and click the button below to execute an autonomous verification re-scan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTriggerReVerification}
                    disabled={verifying}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    {verifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Running Verification Re-Scan...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>I&apos;ve Deployed My Fixes (Verify Now)</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  {/* Re-Scan Snapshot Title & Metadata */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-1.5">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase">Re-Scan Target Status</span>
                    <p className="text-xs font-semibold text-white truncate">
                      {latest.snapshot?.title || 'Verified Post-Fix Crawl'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                      <span>Pages: <strong className="text-white">{latest.discoveredPages.length}</strong></span>
                      <span>
                        Console Errors:{' '}
                        <strong className={(latest.functional?.consoleErrorsCount || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}>
                          {latest.functional?.consoleErrorsCount || 0}
                        </strong>
                      </span>
                      <span>Broken Links: <strong className="text-white">{latest.functional?.brokenLinksCount || 0}</strong></span>
                    </div>
                  </div>

                  {/* Core Security Checklist After Fix */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase block">Security Standards</span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-400">TLS Cert:</span>
                        <span className="text-emerald-400 font-bold">{latest.securityAudit.tlsGrade}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-400">HSTS:</span>
                        <span className={latest.securityAudit.hstsPresent ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {latest.securityAudit.hstsPresent ? 'Configured' : 'Missing'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-400">CSP Policy:</span>
                        <span className="text-cyan-400 font-bold capitalize">{latest.securityAudit.cspStrictness}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-400">security.txt:</span>
                        <span className={latest.securityAudit.securityTxt.rfc9116Valid ? 'text-emerald-400' : 'text-slate-400'}>
                          {latest.securityAudit.securityTxt.rfc9116Valid ? 'Compliant' : 'Missing'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Core Web Vitals After Fix with Diffs */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase block">
                      Performance Metrics & Variance
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
                        <span className="text-[10px] text-slate-400 block">FCP</span>
                        <span className="text-sm font-bold text-white">{latest.performanceMetrics.fcpMs}ms</span>
                        {performanceComparison?.fcp && (
                          <span
                            className={`block text-[10px] mt-0.5 ${
                              performanceComparison.fcp.verdict === 'improved'
                                ? 'text-emerald-400'
                                : performanceComparison.fcp.verdict === 'regressed'
                                ? 'text-red-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {performanceComparison.fcp.delta > 0 ? '+' : ''}
                            {performanceComparison.fcp.delta}ms
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
                        <span className="text-[10px] text-slate-400 block">LCP</span>
                        <span className="text-sm font-bold text-white">{latest.performanceMetrics.lcpMs}ms</span>
                        {performanceComparison?.lcp && (
                          <span
                            className={`block text-[10px] mt-0.5 ${
                              performanceComparison.lcp.verdict === 'improved'
                                ? 'text-emerald-400'
                                : performanceComparison.lcp.verdict === 'regressed'
                                ? 'text-red-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {performanceComparison.lcp.delta > 0 ? '+' : ''}
                            {performanceComparison.lcp.delta}ms
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
                        <span className="text-[10px] text-slate-400 block">CLS</span>
                        <span className="text-sm font-bold text-white">{latest.performanceMetrics.clsScore.toFixed(3)}</span>
                        {performanceComparison?.cls && (
                          <span
                            className={`block text-[10px] mt-0.5 ${
                              performanceComparison.cls.verdict === 'improved'
                                ? 'text-emerald-400'
                                : performanceComparison.cls.verdict === 'regressed'
                                ? 'text-red-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {performanceComparison.cls.delta > 0 ? '+' : ''}
                            {performanceComparison.cls.delta.toFixed(3)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verification Outcome Summary */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/20 via-cyan-950/20 to-slate-900 border border-emerald-500/20 space-y-1.5">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">
                      Verification Summary
                    </span>
                    <p className="text-xs text-slate-300">
                      {summary.verifiedFixedCount} defects verified resolved. {summary.regressionsCount} new regressions detected. {summary.stillPresentCount} issues remaining.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED TABS SECTION */}
      <div className="space-y-4 pt-4 border-t border-white/10 print:border-none">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-1 overflow-x-auto scrollbar-none print:hidden">
          {[
            {
              id: 'matrix',
              label: 'Finding Comparison Matrix',
              count: findingComparisons.length,
            },
            {
              id: 'performance',
              label: 'Performance Intelligence & Vitals',
            },
            {
              id: 'regressions',
              label: 'Functional Regressions',
              count: functionalRegressions.length,
            },
            {
              id: 'prompt',
              label: 'Updated AI Fix Master Prompt',
            },
            {
              id: 'cicd',
              label: 'CI/CD Deployment Integration',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === tab.id
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/10 text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: FINDING COMPARISON MATRIX */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap print:hidden">
              <span className="text-xs font-mono text-slate-500 mr-1">Filter:</span>
              {[
                { id: 'ALL', label: 'All Findings' },
                { id: 'VERIFIED_FIXED', label: 'Verified Fixed', badge: summary.verifiedFixedCount },
                { id: 'REGRESSION', label: 'Regressions', badge: summary.regressionsCount },
                { id: 'STILL_PRESENT', label: 'Still Present', badge: summary.stillPresentCount },
                { id: 'IMPROVED', label: 'Improved', badge: summary.improvedCount },
                { id: 'INCONCLUSIVE', label: 'Inconclusive' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedStatusFilter(f.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                    selectedStatusFilter === f.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {f.label}
                  {f.badge !== undefined && f.badge > 0 && (
                    <span className="ml-1.5 px-1 py-0.2 rounded text-[10px] bg-white/10">
                      {f.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Finding Items List */}
            {filteredFindings.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/30 border border-white/5 text-xs text-slate-400">
                No findings match the selected filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFindings.map((item: FindingComparisonItem, idx: number) => {
                  const getStatusTag = (status: VerificationFindingStatus) => {
                    switch (status) {
                      case 'VERIFIED_FIXED':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            VERIFIED FIXED
                          </span>
                        );
                      case 'REGRESSION':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/30">
                            <ShieldAlert className="w-3 h-3" />
                            REGRESSION DETECTED
                          </span>
                        );
                      case 'STILL_PRESENT':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            STILL PRESENT
                          </span>
                        );
                      case 'IMPROVED':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            <TrendingUp className="w-3 h-3" />
                            IMPROVED
                          </span>
                        );
                      case 'INCONCLUSIVE':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            <HelpCircle className="w-3 h-3" />
                            INCONCLUSIVE
                          </span>
                        );
                      default:
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {status}
                          </span>
                        );
                    }
                  };

                  return (
                    <div
                      key={item.findingId || idx}
                      className="p-4 rounded-xl bg-slate-900/50 border border-white/10 hover:border-cyan-500/30 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusTag(item.status)}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                              item.severity === 'critical' || item.severity === 'high'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : item.severity === 'medium'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {item.severity}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">{item.ruleId}</span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">{item.category}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-slate-300 mt-1">{item.explanation}</p>
                      </div>

                      {/* Side-by-side Evidence Comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs font-mono">
                        <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase block font-bold">
                            Baseline Evidence
                          </span>
                          <p className="text-slate-300 line-clamp-3">
                            {item.baselineEvidence
                              ? JSON.stringify(item.baselineEvidence, null, 1)
                              : 'No baseline evidence recorded'}
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[10px] text-cyan-400 uppercase block font-bold">
                            Re-Scan Observation
                          </span>
                          <p className="text-slate-300 line-clamp-3">
                            {item.latestEvidence
                              ? JSON.stringify(item.latestEvidence, null, 1)
                              : 'No defect observed during re-scan verification'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PERFORMANCE INTELLIGENCE & VITALS */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Before vs After Latency Comparison</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Direct millisecond comparison between Baseline scan and Verified re-scan
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  Noise Tolerance: ±5%
                </span>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="metric" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Baseline" fill="#64748b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Verified" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Metric Detailed Breakdown */}
            {performanceComparison && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">First Contentful Paint</span>
                    <span
                      className={`font-bold uppercase ${
                        performanceComparison.fcp.verdict === 'improved'
                          ? 'text-emerald-400'
                          : performanceComparison.fcp.verdict === 'regressed'
                          ? 'text-red-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {performanceComparison.fcp.verdict}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-white font-bold">{baseline.performanceMetrics.fcpMs}ms → {latest?.performanceMetrics.fcpMs || 0}ms</span>
                    <span className="text-slate-400">{performanceComparison.fcp.percentageChange.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Largest Contentful Paint</span>
                    <span
                      className={`font-bold uppercase ${
                        performanceComparison.lcp.verdict === 'improved'
                          ? 'text-emerald-400'
                          : performanceComparison.lcp.verdict === 'regressed'
                          ? 'text-red-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {performanceComparison.lcp.verdict}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-white font-bold">{baseline.performanceMetrics.lcpMs}ms → {latest?.performanceMetrics.lcpMs || 0}ms</span>
                    <span className="text-slate-400">{performanceComparison.lcp.percentageChange.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Time to First Byte (TTFB)</span>
                    <span
                      className={`font-bold uppercase ${
                        performanceComparison.ttfb.verdict === 'improved'
                          ? 'text-emerald-400'
                          : performanceComparison.ttfb.verdict === 'regressed'
                          ? 'text-red-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {performanceComparison.ttfb.verdict}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-white font-bold">{baseline.performanceMetrics.ttfbMs}ms → {latest?.performanceMetrics.ttfbMs || 0}ms</span>
                    <span className="text-slate-400">{performanceComparison.ttfb.percentageChange.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FUNCTIONAL REGRESSIONS */}
        {activeTab === 'regressions' && (
          <div className="space-y-4">
            {functionalRegressions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Zero Functional Regressions Detected</h4>
                <p className="max-w-md mx-auto text-slate-400">
                  All previously reachable routes remain operational. No newly broken 404 links, console exceptions, or failed assets were introduced by recent changes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-xs text-red-200">
                  <strong className="block text-red-300 font-bold mb-1">
                    Functional Regressions Identified ({functionalRegressions.length}):
                  </strong>
                  The following routes or assets functioned normally during the baseline audit but failed during the post-fix re-scan.
                </div>

                {functionalRegressions.map((reg: FunctionalRegressionItem, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900/60 border border-red-500/30 space-y-2 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                        {reg.type}
                      </span>
                      <span className="text-slate-400 truncate max-w-sm">{reg.url}</span>
                    </div>
                    <p className="text-white font-sans">{reg.message}</p>
                    <div className="text-[11px] text-slate-400">
                      Evidence: <code className="text-cyan-300">{JSON.stringify(reg.evidence)}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: UPDATED AI FIX MASTER PROMPT */}
        {activeTab === 'prompt' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Autonomous AI Fix Prompt Loop
                </h3>
                <p className="text-xs text-slate-400">
                  Copy and feed this updated prompt to any AI coding assistant (Claude, Cursor, Copilot, ChatGPT).
                  It acknowledges verified fixes and focuses directly on remaining issues and new regressions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors flex items-center gap-1.5"
                >
                  {copiedPrompt ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPrompt ? 'Copied to Clipboard' : 'Copy Updated Prompt'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPrompt}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-black/80 border border-white/10 overflow-hidden font-mono text-xs">
              <div className="p-3 bg-slate-900/90 border-b border-white/10 flex items-center justify-between text-slate-400">
                <span className="text-[11px] text-cyan-400">DEVSPHERE_UPDATED_AI_FIX_MASTER_PROMPT.md</span>
                <span className="text-[11px]">Markdown • Production Prompt</span>
              </div>
              <pre className="p-5 text-slate-200 whitespace-pre-wrap overflow-x-auto max-h-[600px] leading-relaxed">
                {session.updatedAiFixPrompt || baseline.aiFixMasterPrompt}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 5: CI/CD DEPLOYMENT INTEGRATION */}
        {activeTab === 'cicd' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <GitBranch className="w-5 h-5" />
                <h3 className="text-base text-white">Continuous Verification via CI/CD Webhooks</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Automatically trigger a DevSphere verification scan whenever your pipeline completes a deployment.
                Supports GitHub Actions, Vercel, Netlify, and custom CI/CD systems with signed webhook verification.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">Webhook Endpoint</span>
                  <code className="text-cyan-300 text-xs">
                    POST /api/v1/cyberlab/verification/webhook
                  </code>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">Payload Structure</span>
                  <pre className="text-slate-300 text-[11px] overflow-x-auto">{JSON.stringify({
                    sessionId: session.id,
                    provider: 'github',
                    commitSha: '6f8a9bc0d...',
                    branch: 'main',
                    environment: 'production',
                    trigger: 'push'
                  }, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
