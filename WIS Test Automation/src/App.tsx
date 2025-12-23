import { useState, useEffect } from 'react';
import { Home, FileText, FolderTree, MessageSquare, AlertCircle, X } from 'lucide-react';
import { DocumentsPage } from './components/DocumentsPage';
import { ProjectStructure } from './components/ProjectStructure';
import { CommunityPage } from './components/CommunityPage';
import { GlobalSearch } from './components/GlobalSearch';
import { structureAPI, documentsAPI, communityAPI } from './utils/api';
import nhsLogo from 'figma:asset/55fd05a819404ec195932d68a2a2a1bc3175a74c.png';

type Page = 'home' | 'documents' | 'structure' | 'community';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [searchData, setSearchData] = useState({
    uiFolders: [],
    apiFolders: [],
    documents: [],
    discussions: [],
  });
  const [projectStructureState, setProjectStructureState] = useState<{
    activeRepo?: 'ui' | 'api';
    selectedFolder?: string;
  }>({});
  const [communityState, setCommunityState] = useState<{
    selectedPostId?: string;
  }>({});

  // Function to check backend connectivity
  const checkBackendConnection = async () => {
    try {
      const response = await fetch(
        `https://euiiwbaymjvykzvtzzfp.supabase.co/functions/v1/make-server-4343c471/health`,
        {
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1aWl3YmF5bWp2eWt6dnR6emZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzOTkxMzgsImV4cCI6MjA4MTk3NTEzOH0.o5FrJooUPEVS2w_3wIhBI0hNmoAcZV1boJlEKQiAEQ4`
          }
        }
      );
      const data = await response.json();
      setBackendConnected(data.status === 'ok');
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendConnected(false);
    }
  };

  // Function to load search data from API
  const loadSearchData = async () => {
    try {
      const [uiFolders, apiFolders, documents, discussions] = await Promise.all([
        structureAPI.getUI(),
        structureAPI.getAPI(),
        documentsAPI.getAll(),
        communityAPI.getPosts(),
      ]);

      setSearchData({
        uiFolders: uiFolders || [],
        apiFolders: apiFolders || [],
        documents: documents || [],
        discussions: discussions || [],
      });
      
      // If we successfully loaded data, backend is connected
      if (backendConnected === false || backendConnected === null) {
        setBackendConnected(true);
      }
    } catch (error) {
      console.error('Error loading search data from API:', error);
      if (backendConnected !== false) {
        setBackendConnected(false);
      }
    }
  };

  // Check backend connection on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Load search data from API on mount and poll for updates
  useEffect(() => {
    loadSearchData(); // Initial load
    
    // Poll every 3 seconds to keep search data fresh
    const interval = setInterval(loadSearchData, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSelectFolder = (repo: 'ui' | 'api', folderName: string) => {
    setProjectStructureState({ activeRepo: repo, selectedFolder: folderName });
  };

  const clearProjectStructureSelection = () => {
    setProjectStructureState({});
  };
  
  const handleSelectPost = (postId: string) => {
    setCommunityState({ selectedPostId: postId });
  };

  const clearCommunitySelection = () => {
    setCommunityState({});
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#005EB8] to-[#003087] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6 relative">
          <img 
            src={nhsLogo} 
            alt="NHS Wales Logo" 
            className="h-32 object-contain absolute top-6 right-6 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => setCurrentPage('home')}
          />
          <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto pr-40">
            <div className="text-center">
              <h1 className="text-5xl mb-3 font-bold">WIS Test Automation</h1>
              <p className="text-xl text-blue-100 font-semibold">Knowledge Hub</p>
            </div>
            {/* Global Search */}
            <div className="w-full">
              <GlobalSearch
                uiFolders={searchData.uiFolders}
                apiFolders={searchData.apiFolders}
                documents={searchData.documents}
                discussions={searchData.discussions}
                onNavigate={setCurrentPage}
                onSelectFolder={handleSelectFolder}
                onSelectPost={handleSelectPost}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 justify-center">
            <button
              onClick={() => setCurrentPage('home')}
              className={`flex items-center gap-2 px-6 py-4 transition-all ${
                currentPage === 'home'
                  ? 'bg-[#005EB8] text-white border-b-4 border-[#003087]'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Home size={20} />
              <span>Home</span>
            </button>
            <button
              onClick={() => setCurrentPage('documents')}
              className={`flex items-center gap-2 px-6 py-4 transition-all ${
                currentPage === 'documents'
                  ? 'bg-[#005EB8] text-white border-b-4 border-[#003087]'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <FileText size={20} />
              <span>Documents</span>
            </button>
            <button
              onClick={() => setCurrentPage('structure')}
              className={`flex items-center gap-2 px-6 py-4 transition-all ${
                currentPage === 'structure'
                  ? 'bg-[#005EB8] text-white border-b-4 border-[#003087]'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <FolderTree size={20} />
              <span>Project Structure</span>
            </button>
            <button
              onClick={() => setCurrentPage('community')}
              className={`flex items-center gap-2 px-6 py-4 transition-all ${
                currentPage === 'community'
                  ? 'bg-[#005EB8] text-white border-b-4 border-[#003087]'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <MessageSquare size={20} />
              <span>Community</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Backend Connection Warning Banner */}
        {backendConnected === false && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-red-800 mb-2 font-bold">Backend Server Not Deployed</h3>
                <p className="text-red-700 mb-3">
                  The Supabase backend server hasn't been deployed yet. You'll see "Failed to fetch" errors until you deploy it.
                </p>
                <div className="bg-red-100 rounded p-4 mb-3">
                  <p className="text-red-900 mb-2 font-semibold">Quick Fix (3 commands):</p>
                  <code className="block bg-red-900 text-red-100 p-3 rounded text-sm font-mono">
                    npm install -g supabase<br/>
                    supabase login<br/>
                    supabase link --project-ref euiiwbaymjvykzvtzzfp<br/>
                    supabase functions deploy make-server-4343c471
                  </code>
                </div>
                <p className="text-red-700 text-sm">
                  📖 For detailed instructions, see: <span className="font-semibold">QUICK_START.md</span> or <span className="font-semibold">SUPABASE_DEPLOYMENT.md</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'home' && <HomePage onNavigate={setCurrentPage} />}
        {currentPage === 'documents' && <DocumentsPage />}
        {currentPage === 'structure' && (
          <ProjectStructure 
            activeRepo={projectStructureState.activeRepo}
            selectedFolder={projectStructureState.selectedFolder}
            onClearSelection={clearProjectStructureSelection}
          />
        )}
        {currentPage === 'community' && (
          <CommunityPage 
            selectedPostId={communityState.selectedPostId}
            onClearSelection={clearCommunitySelection}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#003087] text-white mt-16 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-blue-100">
          <p>Welsh Immunisation System Test Automation Framework © 2024</p>
        </div>
      </footer>
    </div>
  );
}

function HomePage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-[#005EB8]">
        <h2 className="text-2xl mb-4 text-[#003087]">Welcome to the WIS Test Automation Knowledge Hub</h2>
        <p className="text-gray-700 mb-4">
          This platform serves as the central repository for all documentation and knowledge sharing related to the
          Welsh Immunisation System (WIS) Test Automation Framework.
        </p>
        <p className="text-gray-700">
          Use the navigation above to access framework documents and explore our project structure with detailed
          documentation for each component.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => onNavigate('documents')}
          className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-all border-2 border-transparent hover:border-[#005EB8] text-left group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#005EB8] text-white p-4 rounded-lg group-hover:bg-[#003087] transition-colors">
              <FileText size={32} />
            </div>
            <h3 className="text-xl text-[#003087]">Framework Documents</h3>
          </div>
          <p className="text-gray-600">
            Upload, download, and manage official framework documentation, guidelines, and resources.
          </p>
        </button>

        <button
          onClick={() => onNavigate('structure')}
          className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-all border-2 border-transparent hover:border-[#005EB8] text-left group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#005EB8] text-white p-4 rounded-lg group-hover:bg-[#003087] transition-colors">
              <FolderTree size={32} />
            </div>
            <h3 className="text-xl text-[#003087]">Project Structure</h3>
          </div>
          <p className="text-gray-600">
            Explore and document the UI and API repository structures with detailed folder descriptions.
          </p>
        </button>

        <button
          onClick={() => onNavigate('community')}
          className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-all border-2 border-transparent hover:border-[#005EB8] text-left group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#005EB8] text-white p-4 rounded-lg group-hover:bg-[#003087] transition-colors">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-xl text-[#003087]">Community</h3>
          </div>
          <p className="text-gray-600">
            Connect with the community, share knowledge, and collaborate on projects.
          </p>
        </button>
      </div>
    </div>
  );
}