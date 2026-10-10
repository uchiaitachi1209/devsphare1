import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#04060C] text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Col 1 */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">DevSphere Security</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enterprise-grade, evidence-grounded website security posture evaluation and defense intelligence. Built for modern DevSecOps teams.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Passive Rule Engine v1.0.0</span>
          </div>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-mono">
            Posture Checks
          </h4>
          <ul className="space-y-2 text-xs">
            <li className="hover:text-cyan-400 transition-colors">SSL/TLS & Cipher Inspection</li>
            <li className="hover:text-cyan-400 transition-colors">HTTP Security Headers (HSTS, CSP)</li>
            <li className="hover:text-cyan-400 transition-colors">Cookie Security & SameSite Flags</li>
            <li className="hover:text-cyan-400 transition-colors">Redirect Chains & Canonical HTTPS</li>
            <li className="hover:text-cyan-400 transition-colors">DNS SPF & DMARC Verification</li>
            <li className="hover:text-cyan-400 transition-colors">Passive Technology Leakage</li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-mono">
            Compliance & Standards
          </h4>
          <ul className="space-y-2 text-xs">
            <li>OWASP Top 10:2021 Alignment</li>
            <li>OWASP ASVS Verification</li>
            <li>NIST Cybersecurity Framework</li>
            <li>RFC 9116 security.txt Standard</li>
            <li>CWE Taxonomy Integration</li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-mono">
            Platform Access
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/" className="hover:text-cyan-400 transition-colors">Website Scanner</Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Executive Dashboard</Link>
            </li>
            <li>
              <Link href="/history" className="hover:text-cyan-400 transition-colors">Scan History & Diff</Link>
            </li>
            <li>
              <Link href="/settings" className="hover:text-cyan-400 transition-colors">Project Settings</Link>
            </li>
            <li>
              <a href="/docs" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5" /> Fastify OpenAPI Docs
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Disclaimers & Copyright */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            <strong>Disclaimer:</strong> DevSphere Security evaluates publicly observable signals. No automated scanner guarantees 100% security against unobserved or internal vulnerabilities.
          </span>
        </div>
        <div className="text-right">
          &copy; {new Date().getFullYear()} DevSphere Security Platform. Production Phase 1.
        </div>
      </div>
    </footer>
  );
}
