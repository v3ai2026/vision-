
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
import { GeneratedFile, TabType, DeploymentStatus, ModelConfig, Extension, GenerationResult } from './types';

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
  
  // GitHub State
  const [githubToken, setGithubToken] = useState('');
  const [githubRepoName, setGithubRepoName] = useState('');
  const [githubOwner, setGithubOwner] = useState('');
  const [githubInitReadme, setGithubInitReadme] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResultUrl, setSyncResultUrl] = useState<string | null>(null);
  const [gitignoreTemplates, setGitignoreTemplates] = useState<string[]>([]);
  const [licenseTemplates, setLicenseTemplates] = useState<{ key: string; name: string }[]>([]);
  const [selectedGitignore, setSelectedGitignore] = useState('');
  const [selectedLicense, setSelectedLicense] = useState('');

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
  const [crawlResult, setCrawlResult] = useState<ScrapeResult | null>(null);
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

  // Fetch GitHub Templates on Token Input
  useEffect(() => {
    if (githubToken && activeTab === TabType.GITHUB) {
      const gh = new GitHubService(githubToken);
      gh.getGitignoreTemplates().then(setGitignoreTemplates);
      gh.getLicenseTemplates().then(setLicenseTemplates);
    }
  }, [githubToken, activeTab]);

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

  const handleNeuralCrawl = async () => {
    if (!browserInput) return;
    setIsCrawling(true);
    try {
      const result = await performNeuralCrawl(browserInput);
      setCrawlResult(result);
      setKnowledgeVault(prev => [{ ...result, selected: true }, ...prev]);
    } catch (error) {
      alert('Neural Crawl failed.');
    } finally {
      setIsCrawling(false);
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
        repo = await gh.provisionProject({
          name: repoToSync,
          description: `IntelliBuild Studio: ${generationResult.projectName}`,
          isPrivate: true,
          autoInitReadme: githubInitReadme,
          gitignoreTemplate: selectedGitignore || undefined,
          licenseTemplate: selectedLicense || undefined
        });
      } catch (provisionError: any) {
        // Fallback: If repo already exists, we proceed directly to atomic push
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

  const handleListBuckets = async () => {
    if (!gcsToken || !gcsProjectId) {
      alert("GCS Token and Project ID are required.");
      return;
    }
    setIsListingBuckets(true);
    try {
      const gcs = new GCSService(gcsToken);
      const buckets = await gcs.listBuckets(gcsProjectId);
      setGcsBuckets(buckets);
      if (buckets.length > 0) setSelectedBucket(buckets[0].name);
    } catch (error: any) {
      alert(`GCS Error: ${error.message}`);
    } finally {
      setIsListingBuckets(false);
    }
  };

  const handleGCSUpload = async () => {
    if (!generationResult || !gcsToken || !selectedBucket) {
      alert("Active project, GCS Token and Selected Bucket are required.");
      return;
    }
    setIsUploadingGCS(true);
    try {
      const gcs = new GCSService(gcsToken);
      await gcs.uploadProject(selectedBucket, generationResult.files, generationResult.projectName.toLowerCase().replace(/\s+/g, '-'));
      alert("Project files successfully synchronized to GCS.");
    } catch (error: any) {
      alert(`GCS Upload Error: ${error.message}`);
    } finally {
      setIsUploadingGCS(false);
    }
  };

  const handleExportColab = () => {
    if (!generationResult) return;
    const notebookJson = convertToColabNotebook(generationResult.files, generationResult.projectName);
    const blob = new Blob([notebookJson], { type: 'application/x-ipynb+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generationResult.projectName.toLowerCase().replace(/\s+/g, '-')}.ipynb`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-20 border-r border-[#222] flex flex-col items-center py-8 gap-8 bg-[#0a0a0a] relative z-20">
        <div className="w-10 h-10 rounded-full bg-gold-gradient shadow-gold flex items-center justify-center text-black font-black text-lg mb-4 cursor-pointer" onClick={() => setActiveTab(TabType.WORKSPACE)}>I</div>
        {(Object.keys(TabType) as Array<keyof typeof TabType>).map((key) => {
          const tab = TabType[key];
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`p-3 rounded-xl transition-all ${activeTab === tab ? 'bg-white/10 text-[#D4AF37]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} title={key}>
              <div className="w-5 h-5 flex items-center justify-center text-[10px] font-black tracking-tighter">{key.substring(0, 2)}</div>
            </button>
          );
        })}
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-[#222] flex items-center justify-between px-10 bg-black/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Protocol: {activeTab}</span>
            {selectedShards.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">{selectedShards.length} CONTEXT SHARDS INJECTED</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {generationResult && (
              <button 
                onClick={handleExportColab}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[9px] font-black tracking-widest uppercase hover:bg-[#D4AF37] hover:text-black transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Export Colab
              </button>
            )}
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black tracking-widest uppercase hover:bg-white/10 transition-colors">Config</button>
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
              <div className="flex gap-4 flex-wrap justify-center opacity-60">
                {TEMPLATE_LIBRARY.map(tpl => (
                  <button key={tpl.id} onClick={() => setInput(tpl.description)} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:border-[#D4AF37]/30 transition-all">{tpl.name}</button>
                ))}
              </div>
            </div>
          )}

          {activeTab === TabType.GITHUB && (
            <div className="h-full flex flex-col items-center justify-start p-12 max-w-4xl mx-auto gap-12 animate-modal-fade text-center overflow-y-auto custom-scrollbar">
               <div className="w-24 h-24 bg-gold-gradient rounded-[2rem] flex items-center justify-center shadow-gold shrink-0">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-tighter uppercase">GitHub SCM Orchestration</h2>
                <p className="text-[10px] font-black text-gray-600 tracking-[0.4em] uppercase">Enterprise Repository Provisioning</p>
              </div>

              {!syncResultUrl ? (
                <div className="w-full space-y-6 bg-[#121212] border border-[#222] p-10 rounded-[3rem] shadow-2xl text-left">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Access Token</label>
                    <input type="password" placeholder="GitHub Personal Access Token" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} className="w-full bg-black border border-[#222] rounded-2xl px-8 py-5 text-sm outline-none focus:border-[#D4AF37]/50 font-mono" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Owner (Optional)</label>
                      <input type="text" placeholder="e.g. MyOrg or Username" value={githubOwner} onChange={(e) => setGithubOwner(e.target.value)} className="w-full bg-black border border-[#222] rounded-2xl px-8 py-5 text-sm outline-none focus:border-[#D4AF37]/50" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Repository Name</label>
                      <input type="text" placeholder="e.g. my-awesome-project" value={githubRepoName} onChange={(e) => setGithubRepoName(e.target.value)} className="w-full bg-black border border-[#222] rounded-2xl px-8 py-5 text-sm outline-none focus:border-[#D4AF37]/50" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">License Template</label>
                      <select 
                        value={selectedLicense} 
                        onChange={(e) => setSelectedLicense(e.target.value)}
                        className="w-full bg-black border border-[#222] rounded-2xl px-8 py-5 text-sm outline-none focus:border-[#D4AF37]/50"
                      >
                        <option value="">None</option>
                        {licenseTemplates.map(l => (
                          <option key={l.key} value={l.key}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">.gitignore Template</label>
                      <select 
                        value={selectedGitignore} 
                        onChange={(e) => setSelectedGitignore(e.target.value)}
                        className="w-full bg-black border border-[#222] rounded-2xl px-8 py-5 text-sm outline-none focus:border-[#D4AF37]/50"
                      >
                        <option value="">None</option>
                        {gitignoreTemplates.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 px-2 py-4">
                    <button onClick={() => setGithubInitReadme(!githubInitReadme)} className={`w-12 h-6 rounded-full transition-all relative ${githubInitReadme ? 'bg-gold-gradient' : 'bg-[#222]'}`} role="switch" aria-checked={githubInitReadme}>
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${githubInitReadme ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initialize with README.md</span>
                  </div>
                  <button 
                    onClick={handleGitHubSync} 
                    disabled={isSyncing || !generationResult} 
                    className="w-full mt-6 py-6 bg-gold-gradient text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-gold hover:scale-[1.02] disabled:opacity-50 transition-all"
                  >
                    {isSyncing ? 'ORCHESTRATING...' : 'SYNC PROJECT TO GITHUB'}
                  </button>
                  {!generationResult && <p className="text-[9px] font-bold text-red-500/60 uppercase text-center mt-4">No project shard active. Generate a build first.</p>}
                </div>
              ) : (
                <div className="w-full space-y-8 p-10 bg-[#121212] border border-gold-subtle rounded-[3rem] shadow-2xl animate-modal-zoom">
                   <div className="flex items-center justify-center p-6 bg-black border border-[#222] rounded-full">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Project Shard Synchronized</p>
                      <h3 className="text-2xl font-black text-white">{githubRepoName}</h3>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-left">Repository Location</p>
                      <a href={syncResultUrl} target="_blank" rel="noopener noreferrer" className="block p-6 bg-black border border-[#222] rounded-2xl text-[#D4AF37] font-mono text-lg hover:border-[#D4AF37]/50 transition-all truncate">
                        {syncResultUrl}
                      </a>
                   </div>
                   <button 
                    onClick={() => setSyncResultUrl(null)}
                    className="w-full py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest border border-[#222] rounded-xl hover:text-white hover:border-white/20 transition-all"
                  >
                    Back to SCM Panel
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === TabType.GCS && (
            <div className="h-full flex flex-col items-center justify-start p-12 max-w-4xl mx-auto gap-12 animate-modal-fade text-center overflow-y-auto custom-scrollbar">
               <div className="w-24 h-24 bg-gold-gradient rounded-[2rem] flex items-center justify-center shadow-gold shrink-0">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9zM12 7v5l3 3"></path></svg>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-tighter uppercase">Cloud Storage Protocol</h2>
                <p className="text-[10px] font-black text-gray-600 tracking-[0.4em] uppercase">GCS Asset Synchronization</p>
              </div>

              <div className="w-full space-y-6 bg-[#121212] border border-[#222] p-10 rounded-[3rem] shadow-2xl text-left">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Bearer Token</label>
                  <input type="password" placeholder="OAuth2 Access Token" value={gcsToken} onChange={(e) => setGcsToken(e.target.value)} className="w-full bg-black border border-[#222] rounded-2xl px-8 py-5 text-sm outline-none focus:border-[#D4AF37]/50 font-mono" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">GCP Project ID</label>
                  <input type="text" placeholder="e.g. my-gcp-project-123" value={gcsProjectId} onChange={(e) => setGcsProjectId(e.target.value)} className="w-full bg-black border border-[#222] rounded-2xl px-8 py-5 text-sm outline-none focus:border-[#D4AF37]/50" />
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={handleListBuckets} 
                    disabled={isListingBuckets || !gcsToken || !gcsProjectId}
                    className="flex-1 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    {isListingBuckets ? 'PROBING...' : 'DISCOVER BUCKETS'}
                  </button>
                </div>

                {gcsBuckets.length > 0 && (
                  <div className="space-y-4 animate-modal-fade-slide-in">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Target Bucket</label>
                    <select 
                      value={selectedBucket} 
                      onChange={(e) => setSelectedBucket(e.target.value)}
                      className="w-full bg-black border border-[#222] rounded-2xl px-8 py-5 text-sm outline-none focus:border-[#D4AF37]/50"
                    >
                      {gcsBuckets.map(b => (
                        <option key={b.id} value={b.name}>{b.name} ({b.location})</option>
                      ))}
                    </select>
                  </div>
                )}

                <button 
                  onClick={handleGCSUpload} 
                  disabled={isUploadingGCS || !generationResult || !selectedBucket} 
                  className="w-full mt-6 py-6 bg-gold-gradient text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-gold hover:scale-[1.02] disabled:opacity-50 transition-all"
                >
                  {isUploadingGCS ? 'SYNCHRONIZING...' : 'UPLOAD PROJECT TO GCS'}
                </button>
                {!generationResult && <p className="text-[9px] font-bold text-red-500/60 uppercase text-center mt-4">No project shard active. Generate a build first.</p>}
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
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Vercel API Token</label>
                    <input type="password" placeholder="sk_xxxxxxxxxxxx" value={vercelToken} onChange={(e) => setVercelToken(e.target.value)} className="w-full bg-black border border-[#222] rounded-2xl px-8 py-5 text-sm outline-none focus:border-[#D4AF37]/50 font-mono" />
                  </div>
                  <button 
                    onClick={handleDeploy} 
                    disabled={isDeploying || !generationResult}
                    className="w-full py-6 bg-gold-gradient text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-gold hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {isDeploying ? 'ORCHESTRATING PIPELINE...' : 'INITIALIZE PRODUCTION DEPLOY'}
                  </button>
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
