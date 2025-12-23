import { useState, useEffect } from 'react';
import { FolderOpen, ChevronDown, ChevronRight, Edit2, Save, X, Trash2, Plus, ChevronUp, Paperclip, Download } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { structureAPI } from '../utils/api';

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  uploadedAt: number;
  data: string;
}

interface FolderInfo {
  id: string;
  name: string;
  purpose: string;
  description: string;
  attachments?: FileAttachment[];
}

type RepoStructure = FolderInfo[];

const defaultUIFolders: RepoStructure = [
  { id: 'Features', name: 'Features', purpose: '', description: '' },
  { id: 'StepDefinitions', name: 'StepDefinitions', purpose: '', description: '' },
  { id: 'Pages', name: 'Pages', purpose: '', description: '' },
  { id: 'Stubs', name: 'Stubs', purpose: '', description: '' },
  { id: 'API_Requests', name: 'API_Requests', purpose: '', description: '' },
  { id: 'APIHelpers', name: 'APIHelpers', purpose: '', description: '' },
  { id: 'Constants', name: 'Constants', purpose: '', description: '' },
  { id: 'Hooks', name: 'Hooks', purpose: '', description: '' },
  { id: 'Models', name: 'Models', purpose: '', description: '' },
];

const defaultAPIFolders: RepoStructure = [
  { id: 'Controllers', name: 'Controllers', purpose: '', description: '' },
  { id: 'Services', name: 'Services', purpose: '', description: '' },
  { id: 'Models', name: 'Models', purpose: '', description: '' },
  { id: 'Helpers', name: 'Helpers', purpose: '', description: '' },
  { id: 'Tests', name: 'Tests', purpose: '', description: '' },
];

interface ProjectStructureProps {
  activeRepo?: 'ui' | 'api';
  selectedFolder?: string;
  onClearSelection?: () => void;
}

export function ProjectStructure({ activeRepo: initialActiveRepo, selectedFolder: initialSelectedFolder, onClearSelection }: ProjectStructureProps = {}) {
  const [activeRepo, setActiveRepo] = useState<'ui' | 'api'>('ui');
  const [uiFolders, setUIFolders] = useState<RepoStructure>(defaultUIFolders);
  const [apiFolders, setAPIFolders] = useState<RepoStructure>(defaultAPIFolders);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editData, setEditData] = useState<FolderInfo | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    folderName: string | null;
  }>({
    isOpen: false,
    folderName: null,
  });

  // Load from API on mount
  useEffect(() => {
    loadStructures();
  }, []);

  const loadStructures = async () => {
    try {
      const [uiData, apiData] = await Promise.all([
        structureAPI.getUI(),
        structureAPI.getAPI(),
      ]);

      // Set UI folders with fallback to defaults
      if (uiData && uiData.length > 0) {
        setUIFolders(uiData);
      }

      // Set API folders with fallback to defaults
      if (apiData && apiData.length > 0) {
        setAPIFolders(apiData);
      }
    } catch (error) {
      console.error('Failed to load structures from API:', error);
    }
  };

  // Save UI folders to API whenever they change
  useEffect(() => {
    if (uiFolders.length > 0) {
      structureAPI.updateUI(uiFolders).catch((error) => {
        console.error('Failed to save UI structure to API:', error);
      });
    }
  }, [uiFolders]);

  // Save API folders to API whenever they change
  useEffect(() => {
    if (apiFolders.length > 0) {
      structureAPI.updateAPI(apiFolders).catch((error) => {
        console.error('Failed to save API structure to API:', error);
      });
    }
  }, [apiFolders]);

  // Handle navigation from search results
  useEffect(() => {
    if (initialActiveRepo && initialSelectedFolder) {
      setActiveRepo(initialActiveRepo);
      setExpandedFolder(initialSelectedFolder);
      // Clear the selection after a short delay
      setTimeout(() => {
        onClearSelection?.();
      }, 100);
    }
  }, [initialActiveRepo, initialSelectedFolder, onClearSelection]);

  const currentFolders = activeRepo === 'ui' ? uiFolders : apiFolders;
  const setCurrentFolders = activeRepo === 'ui' ? setUIFolders : setAPIFolders;

  const handleFolderClick = (folderName: string) => {
    setExpandedFolder(expandedFolder === folderName ? null : folderName);
    setEditingFolder(null);
    setEditData(null);
  };

  const handleEdit = (folderName: string) => {
    setEditingFolder(folderName);
    setEditData(currentFolders.find((folder) => folder.name === folderName) || null);
  };

  const handleSave = () => {
    if (editingFolder && editData) {
      setCurrentFolders((prev) =>
        prev.map((folder) => (folder.name === editingFolder ? editData : folder))
      );
      setEditingFolder(null);
      setEditData(null);
    }
  };

  const handleCancel = () => {
    setEditingFolder(null);
    setEditData(null);
  };

  const handleAddFolder = () => {
    const newFolder: FolderInfo = {
      id: `newFolder${Date.now()}`,
      name: 'New Folder',
      purpose: '',
      description: '',
    };
    setCurrentFolders((prev) => [...prev, newFolder]);
  };

  const handleDeleteFolder = (folderName: string) => {
    setCurrentFolders((prev) => prev.filter((folder) => folder.name !== folderName));
    if (expandedFolder === folderName) {
      setExpandedFolder(null);
    }
  };

  const moveFolder = (index: number, direction: 'up' | 'down') => {
    const newFolders = [...currentFolders];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newFolders.length) {
      [newFolders[index], newFolders[targetIndex]] = [newFolders[targetIndex], newFolders[index]];
      setCurrentFolders(newFolders);
    }
  };

  const clearField = (field: 'purpose' | 'description') => {
    if (editData) {
      setEditData({ ...editData, [field]: '' });
    }
  };

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editData) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment: FileAttachment = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          uploadedAt: Date.now(),
          data: event.target?.result as string,
        };

        setEditData((prev) => ({
          ...prev!,
          attachments: [...(prev!.attachments || []), newAttachment],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    if (!editData) return;
    setEditData({
      ...editData,
      attachments: editData.attachments?.filter((att) => att.id !== attachmentId) || [],
    });
  };

  const handleDownloadAttachment = (attachment: FileAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name;
    link.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-[#005EB8]">
        <h2 className="text-2xl mb-2 text-[#003087]">Project Structure Documentation</h2>
        <p className="text-gray-600">
          Document the purpose and details of each folder in the UI and API test automation repositories.
        </p>
      </div>

      {/* Repo Selector */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex">
          <button
            onClick={() => {
              setActiveRepo('ui');
              setExpandedFolder(null);
              setEditingFolder(null);
            }}
            className={`flex-1 px-6 py-4 transition-all ${
              activeRepo === 'ui'
                ? 'bg-gradient-to-r from-[#005EB8] to-[#003087] text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="text-lg font-bold">UI</div>
            <div className={`text-sm ${activeRepo === 'ui' ? 'text-blue-100' : 'text-gray-500'}`}>
              {Object.keys(uiFolders).length} folders
            </div>
          </button>
          <button
            onClick={() => {
              setActiveRepo('api');
              setExpandedFolder(null);
              setEditingFolder(null);
            }}
            className={`flex-1 px-6 py-4 transition-all ${
              activeRepo === 'api'
                ? 'bg-gradient-to-r from-[#005EB8] to-[#003087] text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="text-lg font-bold">API</div>
            <div className={`text-sm ${activeRepo === 'api' ? 'text-blue-100' : 'text-gray-500'}`}>
              {Object.keys(apiFolders).length} folders
            </div>
          </button>
        </div>

        {/* Folders List */}
        <div className="divide-y divide-gray-200">
          {currentFolders.map((folder, index) => (
            <div key={folder.name} className="bg-white">
              {/* Folder Header */}
              <div className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <div
                      onClick={() => moveFolder(index, 'up')}
                      className={`p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer ${
                        index === 0 ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                      title="Move up"
                    >
                      <ChevronUp size={14} className="text-gray-600" />
                    </div>
                    <div
                      onClick={() => index < currentFolders.length - 1 && moveFolder(index, 'down')}
                      className={`p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer ${
                        index === currentFolders.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                      title="Move down"
                    >
                      <ChevronDown size={14} className="text-gray-600" />
                    </div>
                  </div>
                  <div 
                    className="bg-[#E8EDEE] p-2 rounded-lg cursor-pointer"
                    onClick={() => handleFolderClick(folder.name)}
                  >
                    <FolderOpen className="text-[#005EB8]" size={24} />
                  </div>
                  <span 
                    className="text-lg text-gray-900 cursor-pointer"
                    onClick={() => handleFolderClick(folder.name)}
                  >{folder.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    onClick={() => setDeleteModal({ isOpen: true, folderName: folder.name })}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer"
                    title="Delete folder"
                  >
                    <Trash2 size={16} />
                  </div>
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleFolderClick(folder.name)}
                  >
                    {expandedFolder === folder.name ? (
                      <ChevronDown className="text-gray-500" size={20} />
                    ) : (
                      <ChevronRight className="text-gray-500" size={20} />
                    )}
                  </div>
                </div>
              </div>

              {/* Folder Details */}
              {expandedFolder === folder.name && (
                <div className="px-6 pb-6 bg-gradient-to-br from-blue-50 to-slate-50">
                  {editingFolder === folder.name && editData ? (
                    // Edit Mode
                    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-[#005EB8]">
                      <div>
                        <label className="block mb-2 text-sm text-gray-700">Folder Name</label>
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
                          placeholder="Enter folder name"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-700">Purpose</label>
                          {editData.purpose && (
                            <button
                              type="button"
                              onClick={() => clearField('purpose')}
                              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                              <X size={12} />
                              Clear
                            </button>
                          )}
                        </div>
                        <textarea
                          value={editData.purpose}
                          onChange={(e) => setEditData({ ...editData, purpose: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005EB8] min-h-24 resize-y"
                          placeholder="e.g., Contains all feature files written in Gherkin"
                          rows={3}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-700">
                            Description (Locators, Methods, etc.)
                          </label>
                          {editData.description && (
                            <button
                              type="button"
                              onClick={() => clearField('description')}
                              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                              <X size={12} />
                              Clear
                            </button>
                          )}
                        </div>
                        <RichTextEditor
                          value={editData.description}
                          onChange={(value) => setEditData({ ...editData, description: value })}
                          placeholder="Detailed description of folder contents, methods, locators, and best practices..."
                          minHeight="min-h-64"
                        />
                      </div>
                      
                      {/* File Attachments */}
                      <div>
                        <label className="block mb-2 text-sm text-gray-700">Attached Files</label>
                        <div className="space-y-2">
                          {editData.attachments && editData.attachments.length > 0 && (
                            <div className="space-y-2 mb-3">
                              {editData.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Paperclip size={16} className="text-gray-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-900 truncate">{attachment.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadAttachment(attachment)}
                                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                      title="Download"
                                    >
                                      <Download size={14} className="text-gray-600" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAttachment(attachment.id)}
                                      className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                      title="Remove"
                                    >
                                      <X size={14} className="text-red-600" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#005EB8] hover:bg-blue-50 transition-colors cursor-pointer">
                            <Paperclip size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-600">Attach files (images, documents, etc.)</span>
                            <input
                              type="file"
                              multiple
                              onChange={handleFileAttachment}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={handleSave}
                          className="flex items-center gap-2 bg-[#005EB8] text-white px-4 py-2 rounded-lg hover:bg-[#003087] transition-colors"
                        >
                          <Save size={16} />
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {folder.purpose || folder.description || (folder.attachments && folder.attachments.length > 0) ? (
                            <>
                              {folder.purpose && (
                                <div className="mb-4">
                                  <h4 className="text-sm text-[#003087] mb-2">Purpose</h4>
                                  <p className="text-gray-700 whitespace-pre-wrap">{folder.purpose}</p>
                                </div>
                              )}
                              {folder.description && (
                                <div className="mb-4">
                                  <h4 className="text-sm text-[#003087] mb-2">Description</h4>
                                  <div 
                                    className="text-gray-700 prose max-w-none"
                                    dangerouslySetInnerHTML={{
                                      __html: folder.description
                                        .replace(/^## (.+)$/gm, '<h3 class="font-bold text-lg mt-4 mb-2">$1</h3>')
                                        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
                                        .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
                                        .replace(/```(.+?)```/gs, '<pre class="bg-gray-100 p-3 rounded my-2 overflow-x-auto"><code>$1</code></pre>')
                                        .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
                                        .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                                        .replace(/(<li class="ml-4">.*<\/li>\n?)+/g, '<ul class="list-disc ml-4 my-2">$&</ul>')
                                        .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">$1</blockquote>')
                                        .replace(/\n/g, '<br>')
                                    }}
                                  />
                                </div>
                              )}
                              {folder.attachments && folder.attachments.length > 0 && (
                                <div>
                                  <h4 className="text-sm text-[#003087] mb-2">Attached Files ({folder.attachments.length})</h4>
                                  <div className="space-y-2">
                                    {folder.attachments.map((attachment) => (
                                      <div
                                        key={attachment.id}
                                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-[#005EB8] transition-colors"
                                      >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <Paperclip size={16} className="text-gray-500 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 truncate">{attachment.name}</p>
                                            <p className="text-xs text-gray-500">
                                              {formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                                            </p>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleDownloadAttachment(attachment)}
                                          className="flex items-center gap-1 px-3 py-1.5 bg-[#005EB8] text-white rounded hover:bg-[#003087] transition-colors text-sm flex-shrink-0"
                                        >
                                          <Download size={14} />
                                          Download
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-500 italic">
                              No documentation yet. Click Edit to add information about this folder.
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleEdit(folder.name)}
                          className="ml-4 flex items-center gap-2 bg-[#005EB8] text-white px-4 py-2 rounded-lg hover:bg-[#003087] transition-colors"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div className="bg-white px-6 py-4">
            <button
              onClick={handleAddFolder}
              className="flex items-center gap-2 bg-[#005EB8] text-white px-4 py-2 rounded-lg hover:bg-[#003087] transition-colors"
            >
              <Plus size={16} />
              Add Folder
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModal.isOpen && deleteModal.folderName && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 text-red-600 p-3 rounded-full">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the folder "{deleteModal.folderName}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ isOpen: false, folderName: null })}
                className="bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteModal.folderName) {
                    handleDeleteFolder(deleteModal.folderName);
                  }
                  setDeleteModal({ isOpen: false, folderName: null });
                }}
                className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}