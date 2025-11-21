import React, { useState } from 'react';
import { Sparkles, Search, ArrowRight, ArrowLeft, BookOpen, Box, Code, ExternalLink, Database, Github, Check } from './components/Icons';
import { generateMLProjects } from './services/geminiService';
import { publishToGitHub } from './services/githubService';
import { ProjectBlueprint, ViewState, GroundingChunk } from './types';
import CodeBlock from './components/CodeBlock';
import GroundingResults from './components/GroundingResults';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('LANDING');
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<ProjectBlueprint[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectBlueprint | null>(null);
  const [groundingData, setGroundingData] = useState<GroundingChunk[]>([]);
  const [error, setError] = useState<string | null>(null);

  // GitHub Modal State
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessUrl, setPublishSuccessUrl] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setViewState('LOADING');
    setError(null);
    try {
      const { projects: generatedProjects, groundingMetadata } = await generateMLProjects(query);
      setProjects(generatedProjects);
      if (groundingMetadata && groundingMetadata.groundingChunks) {
        setGroundingData(groundingMetadata.groundingChunks);
      } else {
        setGroundingData([]);
      }
      setViewState('RESULTS');
    } catch (err) {
      console.error(err);
      setError("Could not generate ideas. Please try a specific topic like 'Computer Vision' or 'LLMs'.");
      setViewState('LANDING');
    }
  };

  const handleSelectProject = (project: ProjectBlueprint) => {
    setSelectedProject(project);
    setViewState('DETAIL');
  };

  const handleBack = () => {
    if (viewState === 'DETAIL') {
      setViewState('RESULTS');
      setSelectedProject(null);
    } else if (viewState === 'RESULTS') {
      setViewState('LANDING');
      setProjects([]);
      setQuery('');
    }
  };

  const handlePublish = async () => {
    if (!githubToken || !selectedProject) return;
    
    setIsPublishing(true);
    setPublishError(null);
    try {
      const url = await publishToGitHub(githubToken, selectedProject);
      setPublishSuccessUrl(url);
    } catch (e: any) {
      setPublishError(e.message || 'Failed to publish to GitHub');
    } finally {
      setIsPublishing(false);
    }
  };

  const closeGithubModal = () => {
    setShowGithubModal(false);
    setPublishSuccessUrl(null);
    setPublishError(null);
    // Don't clear token so user can reuse it
  };

  // --- Sub-Components for different states ---

  const LandingView = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-fade-in">
      <div className="relative mb-8">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-40 animate-pulse"></div>
        <div className="relative p-4 bg-[#09090b] rounded-full border border-white/10">
          <Sparkles className="w-12 h-12 text-blue-400" />
        </div>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
        NeuralForge
      </h1>
      <p className="text-zinc-400 text-lg max-w-2xl mb-12">
        Discover innovative Machine Learning projects powered by the latest Hugging Face models, datasets, and research papers.
      </p>

      <form onSubmit={handleSearch} className="w-full max-w-xl relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-50 group-hover:opacity-100 transition duration-200 blur-sm"></div>
        <div className="relative flex items-center bg-[#18181b] rounded-lg p-1">
          <Search className="w-6 h-6 text-zinc-400 ml-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to build? e.g., 'Audio Generation', 'Medical Imaging'"
            className="w-full bg-transparent border-none outline-none text-white px-4 py-3 placeholder-zinc-500"
            autoFocus
          />
          <button 
            type="submit"
            className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            Generate <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="mt-12 flex flex-wrap justify-center gap-3 text-sm text-zinc-500">
        <span className="px-3 py-1 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors" onClick={() => { setQuery('Transformer Agents'); }}>Transformer Agents</span>
        <span className="px-3 py-1 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors" onClick={() => { setQuery('Stable Diffusion ControlNet'); }}>ControlNet</span>
        <span className="px-3 py-1 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors" onClick={() => { setQuery('RAG with LangChain'); }}>RAG Systems</span>
      </div>
    </div>
  );

  const LoadingView = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-medium text-white animate-pulse">Analyzing Research Papers...</h2>
      <p className="text-zinc-500 mt-2">Finding datasets and models on Hugging Face...</p>
    </div>
  );

  const ResultsView = () => (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <button onClick={handleBack} className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <h2 className="text-xl font-semibold text-zinc-200">Results for "{query}"</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id}
            onClick={() => handleSelectProject(project)}
            className="glass-panel p-6 rounded-xl cursor-pointer hover:bg-white/5 hover:border-blue-500/50 transition-all group flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-4">
              <span className={`text-xs font-mono px-2 py-1 rounded border ${
                project.difficulty === 'Beginner' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                project.difficulty === 'Intermediate' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                'border-red-500/30 text-red-400 bg-red-500/10'
              }`}>
                {project.difficulty}
              </span>
              <Box className="w-5 h-5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-blue-200">{project.title}</h3>
            <p className="text-zinc-400 text-sm mb-6 line-clamp-3 flex-grow">{project.description}</p>
            
            <div className="space-y-3 mt-auto">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <BookOpen className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{project.paper.title}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Code className="w-4 h-4" />
                <span className="truncate max-w-[200px] font-mono">{project.huggingFaceModel.modelId}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <GroundingResults chunks={groundingData} />
    </div>
  );

  const DetailView = () => {
    if (!selectedProject) return null;
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setViewState('RESULTS')} className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Results
          </button>
          <button 
            onClick={() => setShowGithubModal(true)}
            className="bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <Github className="w-4 h-4" /> Export to GitHub
          </button>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/20">
                {selectedProject.domain}
              </span>
              <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium border border-white/10">
                {selectedProject.difficulty}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{selectedProject.title}</h1>
            <p className="text-zinc-300 text-lg leading-relaxed">{selectedProject.description}</p>
          </div>

          <div className="p-8 grid gap-12">
            {/* Core Info Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-purple-400" /> The Model
                </h3>
                <div className="bg-[#0d0d10] p-4 rounded-lg border border-white/10 h-full">
                  <p className="text-sm text-zinc-400 mb-1">Hugging Face ID</p>
                  <code className="text-blue-300 block mb-3 text-sm">{selectedProject.huggingFaceModel.modelId}</code>
                  <a 
                    href={`https://huggingface.co/${selectedProject.huggingFaceModel.modelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 hover:underline"
                  >
                    View on Hub <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-pink-400" /> The Research
                </h3>
                <div className="bg-[#0d0d10] p-4 rounded-lg border border-white/10 h-full">
                  <p className="text-sm text-white mb-1 font-medium line-clamp-2">{selectedProject.paper.title}</p>
                  {selectedProject.paper.authors && <p className="text-xs text-zinc-500 mb-3 line-clamp-1">{selectedProject.paper.authors}</p>}
                  <button className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors text-zinc-300">
                    Search Paper
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-yellow-400" /> Datasets
                 </h3>
                 <div className="bg-[#0d0d10] p-4 rounded-lg border border-white/10 h-full overflow-y-auto max-h-40 custom-scrollbar">
                    {selectedProject.datasets && selectedProject.datasets.length > 0 ? (
                      <ul className="space-y-3">
                        {selectedProject.datasets.map((ds, i) => (
                          <li key={i} className="text-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-zinc-200 truncate max-w-[100px]">{ds.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400">{ds.source}</span>
                            </div>
                            <p className="text-xs text-zinc-500 leading-snug mb-1">{ds.description}</p>
                            {ds.url && (
                              <a href={ds.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                                View Data <ExternalLink className="w-2 h-2" />
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-zinc-500">No specific datasets found.</p>
                    )}
                 </div>
              </div>
            </div>

            {/* Implementation Steps */}
            <div>
               <h3 className="text-lg font-semibold text-white mb-4 border-l-4 border-blue-500 pl-3">Implementation Blueprint</h3>
               <div className="space-y-6 relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/10"></div>
                  {selectedProject.implementationSteps.map((step, idx) => (
                    <div key={idx} className="relative flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#18181b] border border-blue-500/50 flex items-center justify-center text-xs font-bold text-blue-400 z-10">
                        {idx + 1}
                      </div>
                      <div className="pt-0.5">
                        <p className="text-zinc-300">{step}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Tech Stack */}
            <div>
               <h3 className="text-lg font-semibold text-white mb-4">Recommended Tech Stack</h3>
               <div className="flex flex-wrap gap-2">
                 {selectedProject.techStack.map((tech) => (
                   <span key={tech} className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-zinc-300 text-sm">
                     {tech}
                   </span>
                 ))}
               </div>
            </div>

            {/* Code Snippet */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-green-400" /> Starter Code
              </h3>
              <CodeBlock code={selectedProject.pythonSnippet} language="python" />
            </div>

          </div>
        </div>
      </div>
    );
  };

  // GitHub Modal Component
  const GitHubModal = () => {
    if (!showGithubModal) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#0d0d10] border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Github className="w-5 h-5" /> Export to GitHub
            </h3>
            <button onClick={closeGithubModal} className="text-zinc-500 hover:text-white">✕</button>
          </div>

          {publishSuccessUrl ? (
            <div className="text-center py-6">
               <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Check className="w-6 h-6 text-green-500" />
               </div>
               <h4 className="text-lg font-medium text-white mb-2">Repository Created!</h4>
               <p className="text-zinc-400 text-sm mb-6">Your project code has been pushed successfully.</p>
               <a 
                 href={publishSuccessUrl} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors mb-3"
               >
                 View Repository
               </a>
               <button onClick={closeGithubModal} className="text-zinc-500 text-sm hover:text-white">Close</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-400 mb-4">
                To create a repository on your behalf, we need a GitHub Personal Access Token with <code>repo</code> scope.
              </p>
              <div className="mb-4">
                <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Personal Access Token</label>
                <input 
                  type="password" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                  placeholder="ghp_..."
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                />
                <p className="text-[10px] text-zinc-600 mt-1">
                  Your token is used locally and never stored on our servers.
                </p>
              </div>

              {publishError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-200 text-xs mb-4">
                  {publishError}
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={closeGithubModal}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePublish}
                  disabled={isPublishing || !githubToken}
                  className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    isPublishing || !githubToken ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {isPublishing ? 'Creating...' : 'Create Repository'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer" onClick={() => { setViewState('LANDING'); setProjects([]); }}>
             <Sparkles className="w-6 h-6 text-blue-500" />
             <span>NeuralForge</span>
          </div>
          <div className="text-sm text-zinc-500 hidden sm:block">
             Powered by Gemini 2.5 & Hugging Face
          </div>
        </div>
      </nav>

      <main>
        {error && (
          <div className="max-w-lg mx-auto mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}

        {viewState === 'LANDING' && <LandingView />}
        {viewState === 'LOADING' && <LoadingView />}
        {viewState === 'RESULTS' && <ResultsView />}
        {viewState === 'DETAIL' && <DetailView />}
      </main>

      <GitHubModal />
    </div>
  );
};

export default App;