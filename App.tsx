
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { generateFrontendProject } from './services/geminiService';
import { deployToVercel, checkDeploymentStatus } from './services/vercelService';
import { ChatMessage, GeneratedFile, TabType, DeploymentStatus } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<GeneratedFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [currentComponent, setCurrentComponent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>(TabType.EDITOR);
  const [vercelToken, setVercelToken] = useState('');
  const [projectName, setProjectName] = useState('intelligent-ui-builder');
  const [deployment, setDeployment] = useState<DeploymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateFrontendProject(input);
      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        content: `Project **${result.componentName}** initialized. Architectural blueprints are ready in the editor.`,
        files: result.files,
        componentName: result.componentName
      };
      setMessages(prev => [...prev, assistantMsg]);
      setCurrentFiles(result.files);
      setSelectedFileIndex(0);
      setCurrentComponent(result.componentName);
      setActiveTab(TabType.EDITOR);
    } catch (err: any) {
      setError(err.message || "Architectural failure during compilation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeploy = async () => {
    if (!vercelToken || !projectName || currentFiles.length === 0) {
      setError("Authorization credentials and project identifier required.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const dep = await deployToVercel(currentFiles, vercelToken, projectName);
      setDeployment(dep);
    } catch (err: any) {
      setError(err.message || "Cloud propagation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (newValue: string | undefined) => {
    if (newValue === undefined) return;
    setCurrentFiles(prev => {
      const next = [...prev];
      next[selectedFileIndex] = { ...next[selectedFileIndex], content: newValue };
      return next;
    });
  };

  useEffect(() => {
    let interval: any;
    if (deployment && deployment.state !== 'READY' && deployment.state !== 'ERROR') {
      interval = setInterval(async () => {
        try {
          const status = await checkDeploymentStatus(deployment.id, vercelToken);
          setDeployment(status);
          if (status.state === 'READY' || status.state === 'ERROR') {
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Health check failed", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [deployment, vercelToken]);

  return (
    <div className="flex h-screen bg-[#050505] text-slate-300 overflow-hidden font-sans">
      {/* Left Sidebar: Intelligent Agent */}
      <div className="w-[400px] border-r border-white/5 flex flex-col bg-[#0a0a0a]">
        <header className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center font-black text-white shadow-xl shadow-blue-500/10">IB</div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">IntelliBuild</h1>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Compiler Active</span>
              </div>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="py-10 space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-2">Architect's Console</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Provide a blueprint for your next component. I will generate optimized React modules with Tailwind CSS integration.
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest">Inspiration</p>
                <div className="grid gap-2">
                  {[
                    "Glassmorphic crypto dashboard layout",
                    "Animated multi-step onboarding form",
                    "High-fidelity pricing matrix with toggle",
                    "Bento-grid feature showcase section"
                  ].map((tpl, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(tpl)}
                      className="text-left p-3 rounded-xl bg-white/5 border border-transparent hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all text-xs text-slate-300"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-2xl p-4 text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'bg-white/5 border border-white/10 text-slate-200'
              }`}>
                {m.content}
                {m.componentName && (
                  <div className="mt-3 flex items-center space-x-2 text-[10px] text-emerald-400 font-black bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/20">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    <span>{m.componentName} generated successfully</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                </div>
                <span className="text-xs text-slate-500 font-medium">Processing logic gates...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#080808] border-t border-white/5">
          {error && (
            <div className="mb-4 text-[10px] font-bold text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 flex items-start animate-in fade-in slide-in-from-bottom-2">
              <svg className="mr-2 shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Command the AI..."
              className="w-full bg-[#0c0c0c] border border-white/10 rounded-2xl p-4 pr-14 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none resize-none h-32 transition-all placeholder:text-slate-700 group-hover:border-white/20"
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !input.trim()}
              className="absolute bottom-4 right-4 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-xl transition-all active:scale-90 shadow-xl shadow-indigo-600/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Right Content: Advanced Integrated Development Environment */}
      <div className="flex-1 flex flex-col">
        <nav className="flex items-center px-6 bg-[#0a0a0a] border-b border-white/5 h-16">
          <div className="flex space-x-6 h-full items-center">
            <TabButton active={activeTab === TabType.EDITOR} onClick={() => setActiveTab(TabType.EDITOR)} label="Workspace" />
            <TabButton active={activeTab === TabType.PREVIEW} onClick={() => setActiveTab(TabType.PREVIEW)} label="Simulation" />
            <TabButton active={activeTab === TabType.DEPLOY} onClick={() => setActiveTab(TabType.DEPLOY)} label="Cloud Control" />
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
             {deployment && (
               <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center space-x-2 border ${
                 deployment.state === 'READY' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/5 text-indigo-400 border-indigo-500/20 animate-pulse'
               }`}>
                 <span className={`w-2 h-2 rounded-full ${deployment.state === 'READY' ? 'bg-emerald-500' : 'bg-indigo-500 animate-bounce'}`}></span>
                 <span>{deployment.state}</span>
               </div>
             )}
          </div>
        </nav>

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {activeTab === TabType.EDITOR && (
            <div className="flex-1 flex overflow-hidden">
              {/* File Explorer Sidebar */}
              <div className="w-64 bg-[#0a0a0a] border-r border-white/5 p-4 flex flex-col">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Files</p>
                <div className="space-y-1">
                  {currentFiles.length === 0 ? (
                    <p className="text-[10px] text-slate-700 font-bold uppercase p-2 italic">Idle</p>
                  ) : (
                    currentFiles.map((file, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedFileIndex(i)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-all ${
                          selectedFileIndex === i ? 'bg-indigo-500/10 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                        }`}
                      >
                        <svg className={selectedFileIndex === i ? 'text-indigo-500' : 'text-slate-600'} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span className="truncate">{file.path}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Code Surface */}
              <div className="flex-1 flex flex-col bg-[#0c0c0c]">
                {currentFiles.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between px-6 py-3 bg-[#0a0a0a] border-b border-white/5">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-slate-200">{currentFiles[selectedFileIndex].path}</span>
                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500">TypeScript</span>
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(currentFiles[selectedFileIndex].content)}
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        <span>Copy Code</span>
                      </button>
                    </div>
                    <div className="flex-1">
                      <Editor
                        height="100%"
                        theme="vs-dark"
                        defaultLanguage="typescript"
                        path={currentFiles[selectedFileIndex].path}
                        value={currentFiles[selectedFileIndex].content}
                        onChange={handleFileChange}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          roundedSelection: true,
                          scrollBeyondLastLine: false,
                          readOnly: false,
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          padding: { top: 20 },
                          cursorBlinking: 'smooth',
                          smoothScrolling: true,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-700">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4 border border-white/5">
                       <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest">No Active Workspace</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === TabType.PREVIEW && (
            <div className="h-full bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]"></div>
              <div className="relative z-10 p-12 bg-white/60 backdrop-blur-xl rounded-[40px] border border-white shadow-2xl max-w-lg w-full text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-indigo-600 shadow-inner">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Neural Sandbox</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-10">
                  Architectural integrity check for <b>{currentComponent || 'Module'}</b>. This simulated environment validates rendering patterns before edge deployment.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab(TabType.EDITOR)} className="bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95">Edit Source</button>
                  <button onClick={() => setActiveTab(TabType.DEPLOY)} className="bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">Cloud Push</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === TabType.DEPLOY && (
            <div className="h-full bg-[#080808] p-12 flex justify-center overflow-y-auto">
              <div className="max-w-2xl w-full space-y-8">
                <div className="bg-[#0c0c0c] p-10 rounded-[40px] border border-white/5 shadow-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                    <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </div>

                  <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Cloud Provisioning</h2>
                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] mb-10">Edge Propagation Interface</p>
                    
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Access Token</label>
                        <input 
                          type="password"
                          value={vercelToken}
                          onChange={(e) => setVercelToken(e.target.value)}
                          placeholder="••••••••••••••••••••••••"
                          className="w-full bg-[#080808] border border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all placeholder:text-slate-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Project Target</label>
                        <input 
                          type="text"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="Production Identifier"
                          className="w-full bg-[#080808] border border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all"
                        />
                      </div>
                      <button 
                        onClick={handleDeploy}
                        disabled={isGenerating || currentFiles.length === 0}
                        className="w-full bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 py-5 rounded-[24px] font-black text-white shadow-2xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-30 group flex items-center justify-center space-x-3"
                      >
                        {isGenerating ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Negotiating with Edge...</span>
                          </>
                        ) : (
                          <>
                            <span>Initialize Global Deployment</span>
                            <svg className="group-hover:translate-x-1 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                          </>
                        )}
                      </button>
                    </div>

                    {deployment && (
                      <div className="mt-12 p-6 bg-[#080808]/80 rounded-3xl border border-white/5 space-y-6">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Network Phase</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${deployment.state === 'READY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400 animate-pulse'}`}>
                            {deployment.state}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Public URL</span>
                          <div className="flex items-center space-x-3">
                            <a 
                              href={`https://${deployment.url}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-xs text-indigo-400 font-bold hover:bg-white/[0.08] transition-all truncate"
                            >
                              {deployment.url}
                            </a>
                            <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all">
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            </button>
                          </div>
                        </div>
                        <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-1000 ${deployment.state === 'READY' ? 'w-full' : 'w-[45%]'}`} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-indigo-500 uppercase mb-3">Protocol 01</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Automatic asset optimization and global edge distribution via Vercel Network.</p>
                   </div>
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-emerald-500 uppercase mb-3">Protocol 02</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Neural code validation ensuring high-performance React runtime execution.</p>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-2 h-full text-[11px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center group ${
      active ? 'text-white' : 'text-slate-600 hover:text-slate-400'
    }`}
  >
    {label}
    {active && (
      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_-4px_12px_rgba(99,102,241,0.5)]"></span>
    )}
  </button>
);

export default App;
