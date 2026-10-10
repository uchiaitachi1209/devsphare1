'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, Activity, History, Settings, ExternalLink, Zap, Terminal, FlaskConical } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [quickUrl, setQuickUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navItems = [
    { name: 'Scanner', href: '/', icon: Zap },
    { name: 'CyberLab', href: '/cyberlab', icon: FlaskConical, highlight: true },
    { name: 'Dashboard', href: '/dashboard', icon: Activity },
    { name: 'History', href: '/history', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleQuickScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: quickUrl.trim() }),
      });
      const data = await res.json();
      if (data.scanId) {
        setQuickUrl('');
        router.push(`/scans/${data.scanId}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#060913]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-blue-400 p-[1px] shadow-glow-blue transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#070B14] rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                DevSphere
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                SECURITY
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">POSTURE INTELLIGENCE</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/5 p-1 rounded-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : item.highlight
                    ? 'text-cyan-300 hover:text-white hover:bg-cyan-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.highlight && !isActive ? 'text-cyan-400' : ''}`} />
                <span>{item.name}</span>
                {item.highlight && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                    NEW
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Scan Input & API Docs */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleQuickScan} className="hidden lg:flex items-center relative">
            <input
              type="text"
              placeholder="Quick scan (e.g. domain.com)..."
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              className="bg-slate-900/80 border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 w-56 font-mono"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="absolute right-1 text-slate-400 hover:text-cyan-400 p-1"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          </form>

          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border border-white/10 bg-slate-900/60 text-slate-300 hover:text-white hover:border-cyan-500/30 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>OpenAPI</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </div>
    </header>
  );
}
