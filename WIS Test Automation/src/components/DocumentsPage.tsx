import { useState, useEffect } from 'react';
import { 
  Upload, Download, Trash2, FileText, Calendar, Search, 
  Grid3x3, List, Star, Eye, X, ChevronLeft, ChevronRight,
  FileIcon, FileSpreadsheet, Image as ImageIcon, File,
  SortAsc, SortDesc, Tag
} from 'lucide-react';
import { documentsAPI } from '../utils/api';

interface Document {
  id: string;
  name: string;
  size: string;
  uploadedAt?: string;
  uploadDate?: string;
  dataUrl?: string;
  type?: string;
  category?: string;
  isFavorite?: boolean;
}

type ViewMode = 'list' | 'grid';
type SortField = 'name' | 'date' | 'size' | 'type';
type SortDirection = 'asc' | 'desc';

const CATEGORIES = [
  'Test Plans',
  'User Guides',
  'Reports',
  'Specifications',
  'Training Materials',
  'Technical Documentation',
  'Meeting Notes',
  'Other'
];

const ITEMS_PER_PAGE = 12;

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  
  // Sort State
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  
  // Preview State
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  
  // Upload State
  const [uploadCategory, setUploadCategory] = useState('Other');

  // Load documents from API on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Apply filters, search, and sorting when documents or filters change
  useEffect(() => {
    let result = [...documents];

    // Search filter
    if (searchQuery.trim()) {
      result = result.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(doc => doc.category === selectedCategory);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      result = result.filter(doc => doc.isFavorite);
    }

    // Recent filter (last 7 days)
    if (showRecentOnly) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result = result.filter(doc => {
        const uploadDate = new Date(doc.uploadedAt || '');
        return uploadDate >= sevenDaysAgo;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt || '').getTime() - new Date(b.uploadedAt || '').getTime();
          break;
        case 'size':
          comparison = parseSize(a.size) - parseSize(b.size);
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '');
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredDocuments(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [documents, searchQuery, selectedCategory, showFavoritesOnly, showRecentOnly, sortField, sortDirection]);

  const parseSize = (sizeStr: string): number => {
    const units: { [key: string]: number } = { 'Bytes': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024 };
    const match = sizeStr.match(/^([\d.]+)\s*(\w+)$/);
    if (!match) return 0;
    return parseFloat(match[1]) * (units[match[2]] || 1);
  };

  const loadDocuments = async () => {
    try {
      const docs = await documentsAPI.getAll();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setIsLoading(true);
    try {
      for (const file of Array.from(files)) {
        // Convert file to base64 data URL
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        // Upload to API with category
        await documentsAPI.upload({
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          dataUrl,
          category: uploadCategory,
          isFavorite: false,
        } as any);
      }

      // Reload documents
      await loadDocuments();
    } catch (error) {
      console.error('Failed to upload documents:', error);
      alert('Failed to upload one or more documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentsAPI.delete(id);
      await loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleDownload = (doc: Document) => {
    if (doc.dataUrl) {
      const a = document.createElement('a');
      a.href = doc.dataUrl;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const toggleFavorite = async (doc: Document) => {
    try {
      await documentsAPI.update(doc.id, { isFavorite: !doc.isFavorite });
      await loadDocuments();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFileIcon = (type?: string) => {
    if (!type) return <File className="text-gray-500" size={24} />;
    
    if (type.includes('pdf')) return <FileText className="text-red-500" size={24} />;
    if (type.includes('word') || type.includes('document')) return <FileText className="text-blue-500" size={24} />;
    if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="text-green-500" size={24} />;
    if (type.includes('image')) return <ImageIcon className="text-purple-500" size={24} />;
    
    return <FileIcon className="text-gray-500" size={24} />;
  };

  const canPreview = (type?: string): boolean => {
    if (!type) return false;
    return type.includes('pdf') || type.includes('image');
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Get categories with counts
  const categoryCounts = documents.reduce((acc, doc) => {
    const cat = doc.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const recentCount = documents.filter(doc => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const uploadDate = new Date(doc.uploadedAt || '');
    return uploadDate >= sevenDaysAgo;
  }).length;

  const favoritesCount = documents.filter(doc => doc.isFavorite).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-[#005EB8]">
        <h2 className="text-2xl mb-2 text-[#003087]">Framework Documents</h2>
        <p className="text-gray-600">
          Upload and manage official framework documentation, test plans, and reference materials.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-[#005EB8]">
          <div className="text-2xl font-bold text-[#005EB8]">{documents.length}</div>
          <div className="text-sm text-gray-600">Total Documents</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-yellow-600">{favoritesCount}</div>
          <div className="text-sm text-gray-600">Favorites</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{recentCount}</div>
          <div className="text-sm text-gray-600">Recent (7 days)</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">{Object.keys(categoryCounts).length}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`bg-white rounded-xl shadow-md p-6 border-2 border-dashed transition-all ${
          dragActive ? 'border-[#005EB8] bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="bg-[#E8EDEE] w-12 h-12 rounded-full flex items-center justify-center">
            <Upload className="text-[#005EB8]" size={24} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="mb-1 text-[#003087]">Upload Documents</h3>
            <p className="text-sm text-gray-600">Drag and drop files here, or click to browse</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-gray-600" />
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005EB8] text-sm"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <label className="inline-block">
              <input
                type="file"
                multiple
                onChange={handleChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.png,.jpg,.jpeg"
              />
              <span className="bg-[#005EB8] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-[#003087] transition-colors inline-block text-sm">
                Browse Files
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                showFavoritesOnly 
                  ? 'bg-yellow-50 border-yellow-500 text-yellow-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Star size={16} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
              <span className="text-sm">Favorites</span>
            </button>
            <button
              onClick={() => setShowRecentOnly(!showRecentOnly)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                showRecentOnly 
                  ? 'bg-green-50 border-green-500 text-green-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Calendar size={16} />
              <span className="text-sm">Recent</span>
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' ? 'bg-[#005EB8] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="List View"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-[#005EB8] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Grid View"
            >
              <Grid3x3 size={18} />
            </button>
          </div>
        </div>

        {/* Category Filter & Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-1">
            <Tag size={16} className="text-gray-600" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005EB8] text-sm"
            >
              <option value="All">All Categories ({documents.length})</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat} ({categoryCounts[cat] || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleSort('name')}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                sortField === 'name' 
                  ? 'bg-[#005EB8] text-white border-[#005EB8]' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Name {sortField === 'name' && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
            </button>
            <button
              onClick={() => handleSort('date')}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                sortField === 'date' 
                  ? 'bg-[#005EB8] text-white border-[#005EB8]' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Date {sortField === 'date' && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
            </button>
            <button
              onClick={() => handleSort('size')}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                sortField === 'size' 
                  ? 'bg-[#005EB8] text-white border-[#005EB8]' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Size {sortField === 'size' && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length} documents
        </div>
        {(searchQuery || selectedCategory !== 'All' || showFavoritesOnly || showRecentOnly) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setShowFavoritesOnly(false);
              setShowRecentOnly(false);
            }}
            className="text-[#005EB8] hover:text-[#003087] underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Documents Display */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-gray-600">
            {documents.length === 0 ? 'No documents uploaded yet' : 'No documents match your filters'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        // List View
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#005EB8] to-[#003087] text-white px-6 py-4">
            <h3 className="text-lg font-bold">Documents</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {paginatedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="px-6 py-4 hover:bg-blue-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-[#E8EDEE] p-3 rounded-lg">
                    {getFileIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-gray-900 truncate">{doc.name}</h4>
                      {doc.isFavorite && <Star size={16} className="text-yellow-500" fill="currentColor" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span>{doc.size}</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-GB') : 'N/A'}
                      </span>
                      {doc.category && (
                        <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                          <Tag size={12} />
                          {doc.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(doc)}
                    className={`p-2 rounded-lg transition-colors ${
                      doc.isFavorite 
                        ? 'text-yellow-500 hover:bg-yellow-50' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star size={20} fill={doc.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  {canPreview(doc.type) && (
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-[#005EB8] hover:bg-blue-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="bg-gradient-to-br from-[#E8EDEE] to-[#D0DCE0] p-8 flex items-center justify-center relative">
                {getFileIcon(doc.type)}
                {doc.isFavorite && (
                  <div className="absolute top-2 right-2">
                    <Star size={20} className="text-yellow-500" fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h4 className="text-gray-900 mb-2 truncate" title={doc.name}>{doc.name}</h4>
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-GB') : 'N/A'}
                  </div>
                  <div>{doc.size}</div>
                  {doc.category && (
                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded w-fit">
                      <Tag size={10} />
                      {doc.category}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleFavorite(doc)}
                    className={`flex-1 p-2 rounded-lg transition-colors text-sm ${
                      doc.isFavorite 
                        ? 'text-yellow-600 hover:bg-yellow-50 border border-yellow-300' 
                        : 'text-gray-600 hover:bg-gray-100 border border-gray-300'
                    }`}
                    title={doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star size={16} fill={doc.isFavorite ? 'currentColor' : 'none'} className="mx-auto" />
                  </button>
                  {canPreview(doc.type) && (
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="flex-1 p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-300"
                      title="Preview"
                    >
                      <Eye size={16} className="mx-auto" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 p-2 text-[#005EB8] hover:bg-blue-50 rounded-lg transition-colors border border-[#005EB8]"
                    title="Download"
                  >
                    <Download size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-300"
                    title="Delete"
                  >
                    <Trash2 size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-[#005EB8] text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-2">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">{previewDoc.name}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {previewDoc.type?.includes('pdf') ? (
                <iframe
                  src={previewDoc.dataUrl}
                  className="w-full h-full min-h-[600px]"
                  title={previewDoc.name}
                />
              ) : previewDoc.type?.includes('image') ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => handleDownload(previewDoc)}
                className="flex items-center gap-2 bg-[#005EB8] text-white px-4 py-2 rounded-lg hover:bg-[#003087] transition-colors"
              >
                <Download size={16} />
                Download
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
