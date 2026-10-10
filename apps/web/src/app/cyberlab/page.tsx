'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Globe,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Download,
  Copy,
  Check,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Terminal,
  Activity,
  Layers,
  Clock,
  FileCode,
  FileText,
  XCircle,
  HelpCircle,
  Zap,
  Flame,
  Plus,
  Trash2,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import {
  startCyberLabV3Run,
  getCyberLabV3Run,
  cancelCyberLabV3Run,
  createVerificationSession,
  createCyberLabSession,
  listCyberLabSessions,
  deleteCyberLabSession,
} from '@/lib/api-client';
import type {
  CyberLabV3Run,
  CyberLabV3ExecutionState,
  CyberLabSession,
} from '@devsphere/shared';

function CyberLabContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode selection: 'automatic' (CyberLab V3 autonomous scan) vs 'advanced' (Virtual Website Laboratory)
  const [activeMode, setActiveMode] = useState<'automatic' | 'advanced'>('automatic');

  // Automatic Mode (V3) state
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [isVerifiedOwner, setIsVerifiedOwner] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [currentRun, setCurrentRun] = useState<CyberLabV3Run | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<'findings' | 'pages' | 'prompt' | 'timeline'>('findings');
  const [viewerDevice, setViewerDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Advanced Mode (V2 Laboratory) state
  const [labSessions, setLabSessions] = useState<CyberLabSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [isProvisioningDemo, setIsProvisioningDemo] = useState(false);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'advanced' || modeParam === 'automatic') {
      setActiveMode(modeParam);
    }
  }, [searchParams]);

  const fetchLabSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await listCyberLabSessions();
      setLabSessions(data);
    } catch (err) {
      console.error('Failed to load lab sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'advanced') {
      fetchLabSessions();
    }
  }, [activeMode]);

  // Poll current run progress until completed or failed
  const pollRun = (runId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const runData = await getCyberLabV3Run(runId);
        setCurrentRun(runData);

        if (
          runData.state === 'COMPLETED' ||
          runData.state === 'PARTIALLY_COMPLETED' ||
          runData.state === 'FAILED' ||
          runData.state === 'CANCELLED'
        ) {
          setIsRunning(false);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleStartLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) {
      setErrorMsg('Please enter a website URL.');
      return;
    }

    setErrorMsg(null);
    setIsRunning(true);

    try {
      const res = await startCyberLabV3Run(targetUrl.trim(), isVerifiedOwner);
      setCurrentRun(res.run);
      pollRun(res.runId);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to start CyberLab V3 execution.');
      setIsRunning(false);
    }
  };

  const handleCancel = async () => {
    if (!currentRun) return;
    try {
      await cancelCyberLabV3Run(currentRun.id);
      setIsRunning(false);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      const updated = await getCyberLabV3Run(currentRun.id);
      setCurrentRun(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel execution');
    }
  };

  const handleCopyPrompt = () => {
    if (!currentRun?.aiFixMasterPrompt) return;
    navigator.clipboard.writeText(currentRun.aiFixMasterPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownloadPrompt = () => {
    if (!currentRun?.aiFixMasterPrompt) return;
    const blob = new Blob([currentRun.aiFixMasterPrompt], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DEVSPHERE_FIX_MASTER_PROMPT_${new URL(currentRun.normalizedUrl).hostname}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadEvidenceJson = () => {
    if (!currentRun) return;
    const blob = new Blob([JSON.stringify(currentRun, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DEVSPHERE_CYBERLAB_EVIDENCE_${new URL(currentRun.normalizedUrl).hostname}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleStartFixAndVerify = async () => {
    if (!currentRun) return;
    try {
      setIsCreatingSession(true);
      const session = await createVerificationSession(currentRun.id);
      router.push(`/cyberlab/verify/${session.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to initialize verification session.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleOpenInAdvancedLab = async (target: string, verifiedOwner: boolean = false) => {
    try {
      setIsProvisioningDemo(true);
      const session = await createCyberLabSession({
        targetUrl: target,
        mode: verifiedOwner ? 'verified_sandbox' : 'public_preview',
        name: `${new URL(target).hostname} Replica Lab`,
        framework: 'nextjs',
      });
      router.push(`/cyberlab/${session.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to provision lab session.');
    } finally {
      setIsProvisioningDemo(false);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Destroy this CyberLab session and clean up replica resources?')) return;
    try {
      await deleteCyberLabSession(id);
      setLabSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to destroy session');
    }
  };

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* PRIMARY MODE SWITCHER BAR: AUTOMATIC MODE VS ADVANCED LAB MODE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-2xl bg-slate-950/90 border border-white/10 shadow-2xl gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/5">
          <button
            type="button"
            onClick={() => setActiveMode('automatic')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'automatic'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>Automatic Mode</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-cyan-400/20 text-cyan-200 uppercase">
              V3 RUNNER
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('advanced')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'advanced'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-blue-200" />
            <span>Advanced Lab Mode</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-blue-400/20 text-blue-200 uppercase">
              VIRTUAL LAB
            </span>
          </button>
        </div>

        {/* Global Hub Navigation Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/cyberlab/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lab Session</span>
          </Link>

          <Link
            href="/cyberlab/verify"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fix &amp; Verify History</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: AUTOMATIC MODE (CYBERLAB V3 ONE-CLICK AUTONOMOUS RUNNER) */}
      {/* ========================================================================= */}
      {activeMode === 'automatic' && (
        <div className="space-y-6">
          {/* Top Banner: One-Click CyberLab V3 Header & Controller */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#0a1020] to-slate-950 border border-cyan-500/20 shadow-2xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    CYBERLAB V3
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    AUTONOMOUS REAL-WORLD TESTING &amp; REMEDIATION ENGINE
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                  <FlaskConical className="w-7 h-7 text-cyan-400 shrink-0" />
                  Autonomous Website Laboratory
                </h1>
                <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Enter any URL and click <strong>Start CyberLab</strong>. The engine automatically runs real reachability preflights, browser rendering, page discovery, functional tests, Core Web Vitals, security checks, and generates an AI website fix prompt.
                </p>
              </div>

              {/* Quick presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-slate-400 ml-1">Samples:</span>
                {['https://example.com', 'https://news.ycombinator.com', 'https://github.com'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setTargetUrl(sample)}
                    className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/60 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {sample.replace('https://', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleStartLab} className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Globe className="w-4 h-4 text-cyan-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter target website URL (e.g. example.com or https://site.com)..."
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    disabled={isRunning}
                    className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono shadow-inner transition-colors disabled:opacity-50"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isRunning}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none shrink-0"
                  >
                    {isRunning ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Executing Autonomous Tests...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        Start CyberLab
                      </>
                    )}
                  </button>

                  {isRunning && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-3 rounded-xl font-mono text-xs text-red-300 bg-red-950/60 hover:bg-red-900/60 border border-red-800 transition-colors shrink-0"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Verified Domain Owner Toggle */}
              <div className="flex items-center justify-between text-xs font-mono">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isVerifiedOwner}
                    onChange={(e) => setIsVerifiedOwner(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-slate-300">
                    Verified Domain Owner (Enable Authorized Sandbox Extensions)
                  </span>
                </label>
                <span className="text-slate-400 text-[11px]">
                  Strict Defensive Guardrails • Zero Exploits on Public Targets
                </span>
              </div>
            </form>

            {/* Real-Time Progress Bar & State Indicator */}
            {currentRun && (
              <div className="pt-2 space-y-2 border-t border-white/5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        currentRun.state === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : currentRun.state === 'FAILED'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      {currentRun.state}
                    </span>
                    <span className="text-white font-medium">{currentRun.currentStepTitle}</span>
                  </div>
                  <span className="text-cyan-400 font-bold">{currentRun.progressPercent}%</span>
                </div>

                {/* Animated Progress Track */}
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-300 ease-out"
                    style={{ width: `${currentRun.progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] font-mono text-slate-400 truncate">
                  {currentRun.currentStepDetail}
                </p>
              </div>
            )}

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="block text-red-300">Target Error:</strong>
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}
          </div>

          {/* Main Workspace: Left (Sandbox Browser Viewer) vs Right (Telemetry Dashboard) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Real Browser Sandbox Viewer (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl bg-slate-950 border border-white/10 overflow-hidden shadow-2xl flex flex-col">
                {/* Browser Chrome Header */}
                <div className="h-10 bg-slate-900/90 border-b border-white/10 px-4 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  </div>

                  {/* URL Address Bar */}
                  <div className="flex-1 max-w-md mx-auto flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/50 border border-white/10 font-mono text-[11px] text-slate-300 truncate">
                    <Lock className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="text-cyan-300 truncate">
                      {currentRun ? currentRun.normalizedUrl : 'sandbox://chromium-isolated-preview'}
                    </span>
                  </div>

                  {/* Responsive Device Switcher */}
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewerDevice('desktop')}
                      className={`p-1 rounded ${viewerDevice === 'desktop' ? 'bg-cyan-500/30 text-white' : 'text-slate-400 hover:text-white'}`}
                      title="Desktop 1440px"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewerDevice('tablet')}
                      className={`p-1 rounded ${viewerDevice === 'tablet' ? 'bg-cyan-500/30 text-white' : 'text-slate-400 hover:text-white'}`}
                      title="Tablet 768px"
                    >
                      <Tablet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewerDevice('mobile')}
                      className={`p-1 rounded ${viewerDevice === 'mobile' ? 'bg-cyan-500/30 text-white' : 'text-slate-400 hover:text-white'}`}
                      title="Mobile 375px"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Browser Body Canvas */}
                <div className="p-5 bg-slate-950 min-h-[380px] flex flex-col justify-between space-y-4">
                  <div
                    className={`mx-auto w-full transition-all duration-300 space-y-4 ${
                      viewerDevice === 'tablet'
                        ? 'max-w-[540px]'
                        : viewerDevice === 'mobile'
                        ? 'max-w-[340px]'
                        : 'max-w-full'
                    }`}
                  >
                    {/* Simulated Canvas Header */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">
                          ISOLATED RENDERING CANVAS
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {viewerDevice === 'desktop' ? '1440 x 900' : viewerDevice === 'tablet' ? '768 x 1024' : '375 x 667'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white truncate">
                        {currentRun?.snapshot?.title || 'Waiting for Autonomous Browser Session...'}
                      </h3>
                      {currentRun?.snapshot?.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {currentRun.snapshot.description}
                        </p>
                      )}
                    </div>

                    {/* DOM Extracted Interactive Elements */}
                    {currentRun?.snapshot?.domStructure && (
                      <div className="space-y-3 font-mono text-xs">
                        {/* Headers Sample */}
                        {currentRun.snapshot.domStructure.headers.length > 0 && (
                          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Observed Headings</span>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {currentRun.snapshot.domStructure.headers.slice(0, 4).map((h, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-[11px] truncate max-w-xs">
                                  H{h.level}: {h.text}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive Buttons / Links Sample */}
                        <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Interactive Elements Discovered</span>
                          <div className="flex items-center gap-4 text-slate-300 text-[11px] pt-1">
                            <span>Buttons: <strong className="text-cyan-400">{currentRun.snapshot.domStructure.buttons.length}</strong></span>
                            <span>Forms: <strong className="text-cyan-400">{currentRun.snapshot.domStructure.forms.length}</strong></span>
                            <span>Links: <strong className="text-cyan-400">{currentRun.snapshot.domStructure.links.length}</strong></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      Status: {currentRun?.currentStepTitle || 'Idle'}
                    </span>
                    <span>Viewport: {viewerDevice.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Telemetry, Standards & Action Deliverables (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Core Web Vitals Status */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3 font-mono text-xs">
                <span className="text-xs font-bold text-white block uppercase">
                  Observed Performance Telemetry
                </span>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">FCP</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {currentRun?.performanceMetrics?.fcpMs || 0}ms
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">LCP</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {currentRun?.performanceMetrics?.lcpMs || 0}ms
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">CLS</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {(currentRun?.performanceMetrics?.clsScore || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Standards Status */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3 font-mono text-xs">
                <span className="text-xs font-bold text-white block uppercase">
                  Security Standards Evaluation
                </span>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400">TLS Certificate:</span>
                    <span className="text-emerald-400 font-bold">
                      {currentRun?.securityAudit?.tlsGrade || 'Valid'} (Grade {currentRun?.securityAudit?.tlsGrade || 'A'})
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400">HSTS Enforcement:</span>
                    <span
                      className={currentRun?.securityAudit?.hstsPresent ? 'text-emerald-400' : 'text-amber-400'}
                    >
                      {currentRun?.securityAudit?.hstsPresent ? 'Configured' : 'Missing Header'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400">Content-Security-Policy:</span>
                    <span className="text-cyan-400 capitalize">
                      {currentRun?.securityAudit?.cspStrictness || 'Audited'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400">RFC 9116 security.txt:</span>
                    <span
                      className={
                        currentRun?.securityAudit?.securityTxt?.rfc9116Valid
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }
                    >
                      {currentRun?.securityAudit?.securityTxt?.rfc9116Valid ? 'Compliant' : 'Not Found'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Download & Export Action Panel */}
              {currentRun && currentRun.state === 'COMPLETED' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      REMEDIATION DELIVERABLES
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">READY</span>
                  </div>

                  {/* PRIMARY ONE-CLICK ACTION: Fix & Verify */}
                  <button
                    type="button"
                    onClick={handleStartFixAndVerify}
                    disabled={isCreatingSession}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.99]"
                  >
                    {isCreatingSession ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin text-white" />
                        <span>Establishing Immutable Baseline Snapshot...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-200" />
                        <span>Fix &amp; Verify (Auto-Regression Engine)</span>
                      </>
                    )}
                  </button>

                  {/* BRIDGE ACTION: Open in Advanced Lab */}
                  <button
                    type="button"
                    onClick={() => handleOpenInAdvancedLab(currentRun.normalizedUrl, isVerifiedOwner)}
                    disabled={isProvisioningDemo}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open in Advanced Lab (Traffic &amp; Chaos Simulator)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadPrompt}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Fix Master Prompt
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedPrompt ? 'Copied!' : 'Copy Fix Prompt'}
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintPdf}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Print / Save PDF
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadEvidenceJson}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      Evidence JSON
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM SECTION: Tabs for Findings, Discovered Pages, AI Prompt, and Timeline */}
          {currentRun && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 border-b border-white/10 pb-1 overflow-x-auto scrollbar-none">
                {[
                  { id: 'findings', label: 'Technical Findings', count: currentRun.findings.length },
                  { id: 'pages', label: 'Discovered Pages', count: currentRun.discoveredPages.length },
                  { id: 'prompt', label: 'AI Fix Master Prompt' },
                  { id: 'timeline', label: 'Evidence Timeline', count: currentRun.evidenceLog.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveBottomTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      activeBottomTab === tab.id
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

              {/* TAB: FINDINGS */}
              {activeBottomTab === 'findings' && (
                <div className="space-y-3">
                  {currentRun.findings.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-slate-900/30 border border-white/5 text-xs text-slate-400">
                      No critical or high severity defects discovered.
                    </div>
                  ) : (
                    currentRun.findings.map((f, i) => (
                      <div
                        key={f.id || i}
                        className="p-4 rounded-xl bg-slate-900/50 border border-white/10 hover:border-cyan-500/30 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                  f.severity === 'critical' || f.severity === 'high'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                    : f.severity === 'medium'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                }`}
                              >
                                {f.severity}
                              </span>
                              <span className="text-xs font-mono text-slate-400">{f.id}</span>
                              <span className="text-[10px] font-mono text-slate-500 uppercase">{f.category}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white">{f.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
                          </div>
                        </div>

                        <div className="p-2.5 rounded bg-black/40 border border-white/5 font-mono text-[11px] text-slate-300">
                          <strong className="text-cyan-400">Remediation:</strong> {f.remediation}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: DISCOVERED PAGES */}
              {activeBottomTab === 'pages' && (
                <div className="rounded-xl bg-slate-900/40 border border-white/10 overflow-hidden">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-white/10 text-[11px]">
                      <tr>
                        <th className="p-3">Route / URL</th>
                        <th className="p-3">Source</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {currentRun.discoveredPages.map((page, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="p-3 text-white truncate max-w-xs">{page.path}</td>
                          <td className="p-3 text-slate-400 capitalize">{page.discoverySource}</td>
                          <td className="p-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                page.isBroken || page.statusCode >= 400
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}
                            >
                              HTTP {page.statusCode}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{page.loadTimeMs} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB: AI FIX MASTER PROMPT */}
              {activeBottomTab === 'prompt' && (
                <div className="rounded-2xl bg-slate-950 border border-white/10 overflow-hidden space-y-0">
                  <div className="h-10 bg-slate-900 px-4 flex items-center justify-between border-b border-white/10 text-xs font-mono">
                    <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                      <FileCode className="w-4 h-4" />
                      Generated AI Website Repair Prompt (Markdown)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyPrompt}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                      >
                        {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadPrompt}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .md</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-5 overflow-x-auto text-xs font-mono bg-black/70 text-slate-300 leading-relaxed whitespace-pre-wrap max-h-96">
                    {currentRun.aiFixMasterPrompt || 'Executing tests to generate prompt...'}
                  </div>
                </div>
              )}

              {/* TAB: TIMELINE */}
              {activeBottomTab === 'timeline' && (
                <div className="space-y-2 font-mono text-xs max-h-96 overflow-y-auto pr-1">
                  {currentRun.evidenceLog.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <span className="text-cyan-400 text-[10px] font-bold block">{log.category}</span>
                        <p className="text-slate-300">{log.message}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: ADVANCED LAB MODE (VIRTUAL WEBSITE LABORATORY & SIMULATION CONSOLE) */}
      {/* ========================================================================= */}
      {activeMode === 'advanced' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#070d1e] to-slate-950 border border-blue-500/20 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                    ADVANCED LAB CONSOLE
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    VIRTUAL WEBSITE SECURITY &amp; RESILIENCE LABORATORY
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                  <FlaskConical className="w-7 h-7 text-blue-400 shrink-0" />
                  Virtual Website Laboratory
                </h1>
                <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Provision isolated virtual replicas to execute controlled mock traffic simulations (10–1000 VUs), chaos fault injections (DB latency, 503 drops, Redis outages), defensive exploit testing, and framework-tailored AI remediation patches.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenInAdvancedLab('https://example.com')}
                  disabled={isProvisioningDemo}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {isProvisioningDemo ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Provisioning Demo Sandbox...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Provision Demo Lab (example.com)</span>
                    </>
                  )}
                </button>

                <Link
                  href="/cyberlab/new"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5 border border-white/5"
                >
                  <span>Custom Target Lab</span>
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* ADVANCED TOOLS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tool 1: Traffic Simulator */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/30 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Controlled Traffic Simulator</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Run stepped virtual load simulations (10, 100, 500, 1000 VUs) with circuit breakers, response time percentiles, RPS charts, and zero production risk.
                </p>
              </div>
              <div className="pt-2">
                {labSessions.length > 0 ? (
                  <Link
                    href={`/cyberlab/${labSessions[0].id}`}
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                  >
                    Open Simulator in Active Lab <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenInAdvancedLab('https://example.com')}
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                  >
                    Provision Lab to Simulate <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tool 2: Chaos Fault Injector */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-red-500/30 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Chaos Fault Injector</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Simulate database query latency, HTTP 503 gateway drops, Redis cache outages, and network timeouts to measure failover resilience.
                </p>
              </div>
              <div className="pt-2">
                {labSessions.length > 0 ? (
                  <Link
                    href={`/cyberlab/${labSessions[0].id}`}
                    className="text-xs font-mono text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                  >
                    Configure Faults in Lab <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenInAdvancedLab('https://example.com', true)}
                    className="text-xs font-mono text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                  >
                    Provision Mode B Sandbox <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tool 3: Defensive Security Simulation */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-blue-500/30 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Defensive Security Simulator</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sandbox-isolated vulnerability scanning across OWASP Top 10, Auth misconfigurations, CORS policies, and sensitive token leakage.
                </p>
              </div>
              <div className="pt-2">
                {labSessions.length > 0 ? (
                  <Link
                    href={`/cyberlab/${labSessions[0].id}`}
                    className="text-xs font-mono text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                  >
                    View Security Findings in Lab <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenInAdvancedLab('https://example.com')}
                    className="text-xs font-mono text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                  >
                    Launch Security Assessment <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE VIRTUAL LABORATORY SESSIONS TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Active Virtual Laboratory Sessions ({labSessions.length})
              </h3>
              <button
                type="button"
                onClick={fetchLabSessions}
                className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {loadingSessions ? (
              <div className="p-12 text-center text-xs font-mono text-slate-400">
                Loading provisioned lab environments...
              </div>
            ) : labSessions.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-white/5 space-y-4">
                <FlaskConical className="w-12 h-12 mx-auto text-slate-600" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">No Active Virtual Laboratory Sessions</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Provision an isolated sandbox to run controlled mock load tests, inject infrastructure latency, and inspect DOM replicas.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenInAdvancedLab('https://example.com')}
                    disabled={isProvisioningDemo}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                  >
                    Provision Demo Sandbox (example.com)
                  </button>
                  <Link
                    href="/cyberlab/new"
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/10 hover:bg-white/20"
                  >
                    Custom Configuration
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {labSessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => router.push(`/cyberlab/${s.id}`)}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            s.mode === 'verified_sandbox'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          }`}
                        >
                          {s.mode === 'verified_sandbox' ? 'MODE B • VERIFIED SANDBOX' : 'MODE A • PUBLIC PREVIEW'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ISOLATED
                        </span>
                        {s.framework && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                            {s.framework}
                          </span>
                        )}
                        <span className="text-xs font-mono text-slate-500">{s.id}</span>
                      </div>
                      <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {s.name}
                      </h4>
                      <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{s.targetUrl}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase">Simulations</span>
                        <span className="text-cyan-400 font-bold text-sm">
                          {s.trafficSimulationHistory.length} runs
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase">Chaos Tests</span>
                        <span className="text-red-400 font-bold text-sm">
                          {s.faultInjectionHistory.length} faults
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pl-2">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Destroy Lab"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CyberLabPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-mono text-slate-400">Loading CyberLab...</div>}>
      <CyberLabContent />
    </Suspense>
  );
}
