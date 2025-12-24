
// @google/genai guidelines followed: Always use process.env.API_KEY directly for API calls.
import React, { useState, useMemo, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { generateFullStackProject, convertToColabNotebook } from './services/geminiService';
import { deployToVercel, checkDeploymentStatus } from './services/vercelService';
import { GitHubService } from './services/githubService';
import { GCSService } from './services/gcsService';
import { performNeuralCrawl, ScrapeResult } from './services/scraperService';
import { COMPONENT_LIBRARY, TEMPLATE_LIBRARY } from './services/library';
import { NeuralModal, ModalTransition } from './components/NeuralModal';
import { PLUGIN_REGISTRY, getActiveInstructions } from './services/extensionService';
import { GeneratedFile, TabType, DeploymentStatus, ModelConfig, Extension, GenerationResult, AIAgent } from './types';

const INITIAL_SYSTEM = `你是一个顶级进化级全栈 AI 编排 system (IntelliBuild Studio Core)。你正在操作一个分布式的代理集群。风格：极致简约、企业级、奢华金。`;

const App: React.FC = () => {
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    thinkingBudget: 0,
    systemInstruction: INITIAL_SYSTEM
  });

  const [extensions, setExtensions] = useState<Extension[]>(PLUGIN_REGISTRY);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.WORKSPACE);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [deployStatus, setDeployStatus] = useState<DeploymentStatus | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTransition, setModalTransition] = useState<ModalTransition>('fadeSlideIn');
  const [vercelToken, setVercelToken] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubRepoName, setGithubRepoName] = useState('');
  const [githubOwner, setGithubOwner] = useState('');
  const [githubInitReadme, setGithubInitReadme] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResultUrl, setSyncResultUrl] = useState<string | null>(null);

  // Agent Manager State
  const [agents, setAgents] = useState<AIAgent[]>([
    { id: '1', name: 'Architect-Prime', role: 'Full Stack Orchestrator', model: 'gemini-3-pro-preview', instruction: 'Primary architect for SaaS scaffolds.', status: 'active' },
    { id: '2', name: 'Design-Elite', role: 'UI/UX Specialist', model: 'gemini-3-flash-preview', instruction: 'Specializes in Luxury Dark aesthetics.', status: 'idle' }
  ]);
  const [newAgent, setNewAgent] = useState<Partial<AIAgent>>({ model: 'gemini-3-flash-preview' });

  // GCS State
  const [gcsToken, setGcsToken] = useState('');
  const [gcsProjectId, setGcsProjectId] = useState('');
  const [gcsBuckets, setGcsBuckets] = useState<any[]>([]);
  const [selectedBucket, setSelectedBucket] = useState('');
  const [isUploadingGCS, setIsUploadingGCS] = useState(false);
  const [isListingBuckets, setIsListingBuckets] = useState(false);

  // Browser & Knowledge State
  const [browserInput, setBrowserInput] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [knowledgeVault, setKnowledgeVault] = useState<(ScrapeResult & { selected: boolean })[]>([]);

  const selectedShards = useMemo(() => 
    knowledgeVault.filter(s => s.selected).map(s => `[SHARD]: ${s.summary}`), 
  [knowledgeVault]);

  // Polling for deployment status
  useEffect(() => {
    let interval: number;
    if (deployStatus && (deployStatus.state === 'INITIALIZING' || deployStatus.state === 'ANALYZING' || deployStatus.state === 'BUILDING' || deployStatus.state === 'DEPLOYING')) {
      interval = window.setInterval(async () => {
        try {
          const status = await checkDeploymentStatus(deployStatus.id, vercelToken);
          setDeployStatus(status);
        } catch (e) {
          console.error("Status check failed", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [deployStatus, vercelToken]);

  const handleGenerate = async () => {
    if (!input) return;
    setIsGenerating(true);
    try {
      const result = await generateFullStackProject(input, modelConfig, COMPONENT_LIBRARY, selectedShards);
      setGenerationResult(result);
      if (result.files.length > 0) {
        setSelectedFile(result.files[0]);
        setGithubRepoName(result.projectName.toLowerCase().replace(/\s+/g, '-'));
        setActiveTab(TabType.EDITOR);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeploy = async () => {
    if (!generationResult || !vercelToken) return;
    setIsDeploying(true);
    try {
      const status = await deployToVercel(generationResult.files, vercelToken, generationResult.projectName);
      setDeployStatus(status);
      setActiveTab(TabType.DEPLOY);
    } catch (error: any) {
      alert(`Deployment failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleAddAgent = () => {
    if (!newAgent.name || !newAgent.role) return;
    const agent: AIAgent = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAgent.name,
      role: newAgent.role,
      model: newAgent.model || 'gemini-3-flash-preview',
      instruction: newAgent.instruction || '',
      status: 'idle'
    };
    setAgents([...agents, agent]);
    setNewAgent({ model: 'gemini-3-flash-preview' });
  };

  const handleGitHubSync = async () => {
    if (!generationResult || !githubToken) {
      alert("GitHub Token and Generation Result are required.");
      return;
    }
    setSyncResultUrl(null);
    const repoToSync = githubRepoName || generationResult.projectName.toLowerCase().replace(/\s+/g, '-');
    setIsSyncing(true);
    try {
      const gh = new GitHubService(githubToken);
      let owner = githubOwner;
      if (!owner) {
        const user = await gh.getAuthenticatedUser();
        owner = user.login;
        setGithubOwner(owner);
      }
      
      let repo;
      try {
        repo = await gh.provisionProject(repoToSync, `IntelliBuild Studio: ${generationResult.projectName}`, true, githubInitReadme);
      } catch (provisionError: any) {
        if (provisionError.message.includes("401") || provisionError.message.includes("token")) throw provisionError;
        repo = { name: repoToSync, owner: { login: owner }, html_url: `https://github.com/${owner}/${repoToSync}` };
      }
      
      await gh.pushProjectFiles(repo.owner.login, repo.name, generationResult.files);
      setSyncResultUrl(repo.html_url);
    } catch (error: any) {
      alert(`SCM Error: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-20 border-r border-[#222] flex flex-col items-center py-8 gap-8 bg-[#0a0a0a] relative z-20">
        <div className="w-10 h-10 rounded-full bg-gold-gradient shadow-gold flex items-center justify-center text-black font-black text-lg mb-4 cursor-pointer" onClick={() => setActiveTab(TabType.WORKSPACE)}>I</div>
        {(Object.keys(TabType) as Array<keyof typeof TabType>).map((key) => {
          const tab = TabType[key];
          // Filter to show only implemented tabs for simplicity
          const implemented = [TabType.WORKSPACE, TabType.EDITOR, TabType.AGENT_MANAGER, TabType.DEPLOY, TabType.GITHUB, TabType.GCS, TabType.PLUGINS];
          if (!implemented.includes(tab)) return null;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`p-3 rounded-xl transition-all ${activeTab === tab ? 'bg-white/10 text-[#D4AF37]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} title={key}>
              <div className="w-5 h-5 flex items-center justify-center text-[10px] font-black tracking-tighter">{key.substring(0, 2)}</div>
            </button>
          );
        })}
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-[#222] flex items-center justify-between px-10 bg-black/50 backdrop-blur-md z-10 shadow-lg">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Protocol: {activeTab}</span>
          </div>
          <div className="flex items-center gap-4">
            {generationResult && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Project: {generationResult.projectName}</span>
              </div>
            )}
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black tracking-widest uppercase hover:bg-white/10 transition-colors">Studio Config</button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden bg-[#0a0a0a]">
          {activeTab === TabType.WORKSPACE && (
            <div className="h-full flex flex-col items-center justify-center p-10 max-w-4xl mx-auto text-center gap-10 animate-modal-fade">
              <div className="space-y-4">
                <h1 className="text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gold-gradient">IntelliBuild</h1>
                <p className="text-gray-500 text-[10px] font-black tracking-[0.6em] uppercase">Enterprise SaaS Orchestrator</p>
              </div>
              <div className="w-full relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Define your SaaS vision (e.g., 'Modern bento-grid analytics dashboard for crypto')..."
                  className="w-full h-48 bg-[#0a0a0a] border border-[#222] rounded-[2.5rem] p-10 text-xl outline-none focus:border-[#D4AF37]/50 focus:ring-4 focus:ring-[#D4AF37]/5 transition-all resize-none shadow-2xl"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="absolute bottom-8 right-8 px-10 py-4 bg-gold-gradient text-black rounded-2xl font-black text-[11px] tracking-widest uppercase shadow-gold active:scale-95 transition-all"
                >
                  {isGenerating ? 'Synthesizing...' : 'Initialize Build'}
                </button>
              </div>
            </div>
          )}

          {activeTab === TabType.AGENT_MANAGER && (
            <div className="h-full flex overflow-hidden animate-modal-fade">
              <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-12">
                  <div className="flex justify-between items-end">
                    <div className="space-y-2">
                      <h2 className="text-4xl font-black tracking-tighter uppercase">Agent Collective</h2>
                      <p className="text-[10px] font-black text-gray-600 tracking-[0.4em] uppercase">Distributed Intelligence Control</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {agents.map(agent => (
                      <div key={agent.id} className="p-8 bg-[#121212] border border-[#222] rounded-[2rem] space-y-6 hover:border-[#D4AF37]/40 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-gradient opacity-[0.03] rounded-bl-[4rem] group-hover:opacity-[0.08] transition-opacity" />
                        <div className="flex justify-between items-start relative">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">{agent.role}</span>
                            <h3 className="text-2xl font-black text-white">{agent.name}</h3>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${agent.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'}`}>
                            {agent.status}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2">{agent.instruction}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{agent.model}</span>
                          <div className="flex gap-2">
                            <button className="p-2 hover:text-[#D4AF37] transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
                            <button className="p-2 hover:text-red-500 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* New Agent Form Card */}
                    <div className="p-8 bg-black border-2 border-dashed border-[#222] rounded-[2rem] flex flex-col items-center justify-center gap-6 hover:border-[#D4AF37]/40 transition-all">
                       <div className="w-full space-y-4">
                          <input 
                            type="text" 
                            placeholder="Agent Name" 
                            className="w-full bg-[#121212] border border-[#222] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50" 
                            value={newAgent.name || ''}
                            onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                          />
                          <input 
                            type="text" 
                            placeholder="Role (e.g. Debugger)" 
                            className="w-full bg-[#121212] border border-[#222] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50"
                            value={newAgent.role || ''}
                            onChange={e => setNewAgent({...newAgent, role: e.target.value})}
                          />
                          <select 
                             className="w-full bg-[#121212] border border-[#222] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50 appearance-none"
                             value={newAgent.model}
                             onChange={e => setNewAgent({...newAgent, model: e.target.value})}
                          >
                             <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                             <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                          </select>
                       </div>
                       <button 
                        onClick={handleAddAgent}
                        className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all"
                       >
                         Provision Intelligence Shard
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === TabType.EDITOR && generationResult && (
            <div className="h-full flex overflow-hidden animate-modal-fade">
              <div className="w-72 border-r border-[#222] bg-[#050505] overflow-y-auto">
                <div className="p-6 text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-[#222]">Project Shards</div>
                {generationResult.files.map(file => (
                  <button key={file.path} onClick={() => setSelectedFile(file)} className={`w-full text-left px-8 py-4 text-xs font-bold border-l-2 transition-all ${selectedFile?.path === file.path ? 'bg-[#D4AF37]/5 border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}>
                    {file.path.split('/').pop()}
                  </button>
                ))}
              </div>
              <div className="flex-1">
                <Editor height="100%" theme="vs-dark" path={selectedFile?.path} defaultLanguage="typescript" value={selectedFile?.content} options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 20 } }} />
              </div>
            </div>
          )}

          {activeTab === TabType.DEPLOY && (
            <div className="h-full flex flex-col items-center justify-start p-12 max-w-4xl mx-auto gap-12 animate-modal-fade overflow-y-auto custom-scrollbar">
              <div className="w-24 h-24 bg-gold-gradient rounded-[2rem] flex items-center justify-center shadow-gold shrink-0">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-black tracking-tighter uppercase">Vercel Edge Pipeline</h2>
                <p className="text-[10px] font-black text-gray-600 tracking-[0.4em] uppercase">Static Assets + Dynamic Edge Functions</p>
              </div>

              {!deployStatus ? (
                <div className="w-full space-y-8 bg-[#121212] border border-[#222] p-10 rounded-[3rem] shadow-2xl">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Vercel API Token</label>
                      <input type="password" placeholder="sk_xxxxxxxxxxxx" value={vercelToken} onChange={(e) => setVercelToken(e.target.value)} className="w-full bg-black border border-[#222] rounded-2xl px-8 py-5 text-sm outline-none focus:border-[#D4AF37]/50 font-mono" />
                    </div>
                    {generationResult && (
                      <div className="p-6 bg-black border border-gold-subtle/20 rounded-2xl">
                        <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Target Project Shard</p>
                        <p className="text-white font-bold text-lg">{generationResult.projectName}</p>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleDeploy} 
                    disabled={isDeploying || !generationResult || !vercelToken}
                    className="w-full py-6 bg-gold-gradient text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-gold hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {isDeploying ? 'ORCHESTRATING PIPELINE...' : 'INITIALIZE PRODUCTION DEPLOY'}
                  </button>
                  {!vercelToken && <p className="text-[9px] font-bold text-red-500/60 uppercase text-center">Authorization required for deployment</p>}
                </div>
              ) : (
                <div className="w-full space-y-8 p-10 bg-[#121212] border border-gold-subtle rounded-[3rem] shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[#222] pb-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Build Status</p>
                      <p className="text-[#D4AF37] font-black text-xl uppercase tracking-tighter animate-pulse">{deployStatus.state}</p>
                    </div>
                    <div className="px-4 py-2 bg-black border border-[#222] rounded-xl text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                      Edge Runtime Active
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Production Endpoint</p>
                    <a href={`https://${deployStatus.url}`} target="_blank" rel="noopener noreferrer" className="block p-6 bg-black border border-[#222] rounded-2xl text-[#D4AF37] font-mono text-lg hover:border-[#D4AF37]/50 transition-all truncate">
                      {deployStatus.url}
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-black/40 border border-[#222] rounded-2xl">
                        <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Static Layers</p>
                        <p className="text-white font-bold text-xs uppercase">Optimized</p>
                     </div>
                     <div className="p-4 bg-black/40 border border-[#222] rounded-2xl">
                        <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Compute Mode</p>
                        <p className="text-white font-bold text-xs uppercase">Dynamic Edge</p>
                     </div>
                  </div>

                  <button 
                    onClick={() => setDeployStatus(null)}
                    className="w-full py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest border border-[#222] rounded-xl hover:text-white hover:border-white/20 transition-all"
                  >
                    Deploy New Shard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <NeuralModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Studio Core Configuration" transition={modalTransition} size="lg">
        <div className="space-y-12">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Temperature</label>
              <input type="range" min="0" max="1" step="0.1" value={modelConfig.temperature} onChange={(e) => setModelConfig({...modelConfig, temperature: parseFloat(e.target.value)})} className="w-full accent-[#D4AF37] bg-white/5 h-1.5 rounded-full appearance-none" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Reasoning Shards</label>
              <select value={modelConfig.thinkingBudget} onChange={(e) => setModelConfig({...modelConfig, thinkingBudget: parseInt(e.target.value)})} className="w-full bg-black border border-[#222] rounded-2xl px-6 py-4 text-[11px] font-bold text-gray-300 outline-none">
                <option value="0">Standard Inference</option>
                <option value="16384">Balanced Reasoning</option>
                <option value="32768">Deep Reasoning</option>
              </select>
            </div>
          </div>
        </div>
      </NeuralModal>
    </div>
  );
};

export default App;
