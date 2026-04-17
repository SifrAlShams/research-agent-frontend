"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, Send, Loader2, CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for cleaner tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



export default function ResearchAgent() {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState('Ready to research...');
  const [progress, setProgress] = useState<string[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const reportEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of report as it generates
  useEffect(() => {
    reportEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [report]);

  const startResearch = () => {
    if (!topic || loading) return;
    
    setLoading(true);
    setReport(null);
    setProgress([]);
    setError(null);
    setStatus('Initializing agents...');
    
    const threadId = uuidv4();
    // Production Note: Use env vars for URLs
    const wsUrl = process.env.NEXT_PUBLIC_API_URL || 'http://13.61.11.143:8000';
    socket.current = new WebSocket(`${wsUrl}/ws/research/${threadId}`);

    socket.current.onopen = () => {
      socket.current?.send(JSON.stringify({ topic }));
    };

    socket.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }

        if (data.status) {
          setStatus(data.status);
          // Only add to progress list if it's a new milestone
          setProgress((prev) => prev.includes(data.status) ? prev : [...prev, data.status]);
        }

        if (data.is_final) {
          setReport(data.report_content);
          setLoading(false);
          socket.current?.close();
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    socket.current.onerror = () => {
      setError("Server connection failed. Is the backend running at localhost:8000?");
      setLoading(false);
    };
  };

  const handleDownload = async (format: 'md' | 'docx' = 'docx') => {
    if (!report) return;

    const filename = `research_report_${new Date().toISOString().split('T')[0]}.${format}`;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_API_URL || 'http://13.61.11.143:8000';
      const apiUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      const response = await fetch(`${apiUrl}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: report,
          filename: filename
        })
      });

      if (!response.ok) throw new Error('Download failed from server');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download from server, falling back to local.", error);
      const blob = new Blob([report], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
    
    // THE VANISH LOGIC: Wipe everything immediately after download
    setReport(null);
    setTopic('');
    setStatus('Ready for next task.');
    setProgress([]);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <header className="mb-12 space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider">
            AI Research Lab
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Deep Agentic Research</h1>
          <p className="text-lg text-slate-500">Autonomous multi-agent system with real-time auditing.</p>
        </header>

        {/* Search Interface */}
        <div className="bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 mb-10 flex items-center gap-2">
          <input
            className="flex-1 bg-transparent p-4 text-lg outline-none placeholder:text-slate-400"
            placeholder="What would you like to research today?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startResearch()}
            disabled={loading}
          />
          <button
            onClick={startResearch}
            disabled={loading || !topic}
            className={cn(
              "px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95",
              loading ? "bg-slate-100 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
            )}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
            {loading ? "Analyzing..." : "Research"}
          </button>
        </div>

        {/* Status & Progress */}
        {(loading || progress.length > 0) && !report && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-progress-buffer w-1/2" />
              </div>
              <span className="text-sm font-medium text-blue-600 whitespace-nowrap">{status}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {progress.map((step, i) => (
                <div key={i} className="flex items-center gap-3 bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span className="text-sm text-slate-600 font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 p-4 rounded-xl text-red-700 animate-in shake-in duration-300">
            <ShieldAlert className="shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Disappearing Report View */}
        {report && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
            <div className="px-6 py-4 bg-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Final Synthesis</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {setReport(null); setTopic('');}}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  title="Discard"
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={() => handleDownload('md')}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                  title="Download as Markdown"
                >
                  <Download size={16} /> MD
                </button>
                <button
                  onClick={() => handleDownload('docx')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                  title="Download as Word Document & Burn"
                >
                  <Download size={16} /> DOCX & Burn
                </button>
              </div>
            </div>
            
            <div className="p-8 md:p-16 prose prose-slate prose-lg max-w-none overflow-y-auto max-h-[75vh]">
              <ReactMarkdown>{report}</ReactMarkdown>
              <div ref={reportEndRef} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
