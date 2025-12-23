import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, FolderOpen, MessageSquare } from 'lucide-react';

interface SearchResult {
  type: 'folder' | 'document' | 'discussion';
  title: string;
  description: string;
  highlightedSnippet?: React.ReactNode;
  repo?: 'ui' | 'api';
  onClick: () => void;
}

interface GlobalSearchProps {
  uiFolders: any[];
  apiFolders: any[];
  documents: any[];
  discussions: any[];
  onNavigate: (page: 'home' | 'documents' | 'structure' | 'azure' | 'community') => void;
  onSelectFolder?: (repo: 'ui' | 'api', folderName: string) => void;
  onSelectPost?: (postId: string) => void;
}

export function GlobalSearch({ 
  uiFolders, 
  apiFolders, 
  documents, 
  discussions, 
  onNavigate,
  onSelectFolder,
  onSelectPost
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Helper function to extract and highlight text snippet
  const getHighlightedSnippet = (text: string, searchTerm: string, maxLength: number = 100) => {
    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerSearch);
    
    if (index === -1) return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    
    // Calculate snippet boundaries
    const snippetStart = Math.max(0, index - 30);
    const snippetEnd = Math.min(text.length, index + searchTerm.length + 70);
    
    let snippet = text.substring(snippetStart, snippetEnd);
    
    // Add ellipsis if needed
    if (snippetStart > 0) snippet = '...' + snippet;
    if (snippetEnd < text.length) snippet = snippet + '...';
    
    // Create highlighted version
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    const snippetLower = snippet.toLowerCase();
    
    let searchIndex = snippetLower.indexOf(lowerSearch);
    while (searchIndex !== -1) {
      // Add text before match
      if (searchIndex > currentIndex) {
        parts.push(snippet.substring(currentIndex, searchIndex));
      }
      
      // Add highlighted match
      parts.push(
        <span key={`highlight-${currentIndex}`} className="bg-yellow-200 font-medium">
          {snippet.substring(searchIndex, searchIndex + searchTerm.length)}
        </span>
      );
      
      currentIndex = searchIndex + searchTerm.length;
      searchIndex = snippetLower.indexOf(lowerSearch, currentIndex);
    }
    
    // Add remaining text
    if (currentIndex < snippet.length) {
      parts.push(snippet.substring(currentIndex));
    }
    
    return <>{parts}</>;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setResults([]);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const foundResults: SearchResult[] = [];

    // Search UI folders
    uiFolders.forEach((folder) => {
      let matchedText = '';
      
      if (folder.name.toLowerCase().includes(searchLower)) {
        // Title matches, check if description or purpose also has content
        matchedText = folder.description || folder.purpose || '';
      } else if (folder.purpose.toLowerCase().includes(searchLower)) {
        matchedText = folder.purpose;
      } else if (folder.description.toLowerCase().includes(searchLower)) {
        matchedText = folder.description;
      }
      
      if (matchedText || folder.name.toLowerCase().includes(searchLower)) {
        const highlightedSnippet = matchedText ? getHighlightedSnippet(matchedText, searchTerm) : undefined;
        
        foundResults.push({
          type: 'folder',
          title: folder.name,
          description: folder.purpose || 'UI Test Automation Folder',
          highlightedSnippet,
          repo: 'ui',
          onClick: () => {
            onNavigate('structure');
            onSelectFolder?.('ui', folder.name);
            setIsOpen(false);
            setSearchTerm('');
          },
        });
      }
    });

    // Search API folders
    apiFolders.forEach((folder) => {
      let matchedText = '';
      
      if (folder.name.toLowerCase().includes(searchLower)) {
        // Title matches, check if description or purpose also has content
        matchedText = folder.description || folder.purpose || '';
      } else if (folder.purpose.toLowerCase().includes(searchLower)) {
        matchedText = folder.purpose;
      } else if (folder.description.toLowerCase().includes(searchLower)) {
        matchedText = folder.description;
      }
      
      if (matchedText || folder.name.toLowerCase().includes(searchLower)) {
        const highlightedSnippet = matchedText ? getHighlightedSnippet(matchedText, searchTerm) : undefined;
        
        foundResults.push({
          type: 'folder',
          title: folder.name,
          description: folder.purpose || 'API Test Automation Folder',
          highlightedSnippet,
          repo: 'api',
          onClick: () => {
            onNavigate('structure');
            onSelectFolder?.('api', folder.name);
            setIsOpen(false);
            setSearchTerm('');
          },
        });
      }
    });

    // Search documents
    documents.forEach((doc) => {
      if (doc.name.toLowerCase().includes(searchLower)) {
        foundResults.push({
          type: 'document',
          title: doc.name,
          description: `Uploaded ${new Date(doc.uploadedAt).toLocaleDateString()}`,
          onClick: () => {
            onNavigate('documents');
            setIsOpen(false);
            setSearchTerm('');
          },
        });
      }
    });

    // Search discussions (posts and comments)
    discussions.forEach((discussion) => {
      let matchReason = '';
      let highlightedSnippet: React.ReactNode | undefined;
      let matchedText = '';
      
      // Check post name first (skip snippet if title matches)
      const titleMatches = discussion.name?.toLowerCase().includes(searchLower);
      
      // Check post message
      if (discussion.message?.toLowerCase().includes(searchLower)) {
        matchedText = discussion.message;
        matchReason = `In post • ${discussion.comments?.length || 0} comments`;
      }
      
      // Check comments if no post message match
      if (!matchedText && discussion.comments) {
        for (const comment of discussion.comments) {
          if (comment.message?.toLowerCase().includes(searchLower)) {
            matchedText = comment.message;
            matchReason = `In comment by ${comment.name}`;
            break;
          }
          if (comment.name?.toLowerCase().includes(searchLower)) {
            matchedText = comment.message || `Comment by ${comment.name}`;
            matchReason = `Comment author: ${comment.name}`;
            break;
          }
        }
      }
      
      // Only add result if something matched
      if (titleMatches || matchedText) {
        if (matchedText) {
          highlightedSnippet = getHighlightedSnippet(matchedText, searchTerm);
        } else if (titleMatches) {
          matchReason = `${discussion.comments?.length || 0} comments`;
        }
        
        foundResults.push({
          type: 'discussion',
          title: discussion.name || 'Untitled',
          description: matchReason,
          highlightedSnippet,
          onClick: () => {
            onNavigate('community');
            onSelectPost?.(discussion.id);
            setIsOpen(false);
            setSearchTerm('');
          },
        });
      }
    });

    setResults(foundResults.slice(0, 10)); // Limit to 10 results
  }, [searchTerm, uiFolders, apiFolders, documents, discussions, onNavigate, onSelectFolder, onSelectPost]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search everything..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searchTerm && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={result.onClick}
                  className="w-full px-4 py-3 hover:bg-blue-50 transition-colors text-left flex items-start gap-3"
                >
                  <div className="mt-1">
                    {result.type === 'folder' && (
                      <div className="bg-[#E8EDEE] p-2 rounded">
                        <FolderOpen className="text-[#005EB8]" size={16} />
                      </div>
                    )}
                    {result.type === 'document' && (
                      <div className="bg-blue-100 p-2 rounded">
                        <FileText className="text-[#005EB8]" size={16} />
                      </div>
                    )}
                    {result.type === 'discussion' && (
                      <div className="bg-green-100 p-2 rounded">
                        <MessageSquare className="text-green-600" size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{result.title}</div>
                    <div className="text-sm text-gray-500">
                      {result.description}
                      {result.repo && (
                        <span className="ml-2 text-xs bg-[#005EB8] text-white px-2 py-0.5 rounded">
                          {result.repo.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {result.highlightedSnippet && (
                      <div className="mt-1 text-sm text-gray-500">
                        {result.highlightedSnippet}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="mx-auto mb-2 text-gray-400" size={32} />
              <p>No results found for "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}