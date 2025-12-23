import { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock, MessageCircle, Paperclip, X, Download, Image as ImageIcon, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { communityAPI } from '../utils/api';

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  dataUrl: string;
}

interface Comment {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  attachments?: Attachment[];
}

interface Post {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  comments: Comment[];
  attachments?: Attachment[];
}

interface CommunityPageProps {
  selectedPostId?: string;
  onClearSelection?: () => void;
}

const formatTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export function CommunityPage({ selectedPostId, onClearSelection }: CommunityPageProps = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostName, setNewPostName] = useState('');
  const [newPostMessage, setNewPostMessage] = useState('');
  const [newPostAttachments, setNewPostAttachments] = useState<Attachment[]>([]);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentName, setCommentName] = useState('');
  const [commentMessage, setCommentMessage] = useState('');
  const [commentAttachments, setCommentAttachments] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<{ name?: string; message?: string }>({});
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'post' | 'comment' | null;
    postId: string | null;
    commentId: string | null;
  }>({
    isOpen: false,
    type: null,
    postId: null,
    commentId: null,
  });

  // Load posts from API on mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const postsData = await communityAPI.getPosts();
      // Sort posts by most recent activity (post or comment timestamp)
      const sortedPosts = postsData.sort((a, b) => {
        const aLatestTime = a.comments.length > 0 
          ? Math.max(new Date(a.timestamp).getTime(), ...a.comments.map(c => new Date(c.timestamp).getTime()))
          : new Date(a.timestamp).getTime();
        const bLatestTime = b.comments.length > 0 
          ? Math.max(new Date(b.timestamp).getTime(), ...b.comments.map(c => new Date(c.timestamp).getTime()))
          : new Date(b.timestamp).getTime();
        return bLatestTime - aLatestTime; // Newest first
      });
      setPosts(sortedPosts);
    } catch (error) {
      console.error('Failed to load community posts from API:', error);
    }
  };

  // Handle navigation from search results
  useEffect(() => {
    if (selectedPostId) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const postElement = document.getElementById(`post-${selectedPostId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedPostId(selectedPostId);
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedPostId(null);
          }, 3000);
        }
        onClearSelection?.();
      }, 100);
    }
  }, [selectedPostId, onClearSelection]);

  const validatePostForm = (): boolean => {
    const newErrors: { name?: string; message?: string } = {};
    
    if (!newPostName.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!newPostMessage.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCommentForm = (): boolean => {
    const newErrors: { name?: string; message?: string } = {};
    
    if (!commentName.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!commentMessage.trim()) {
      newErrors.message = 'Comment is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileUpload = async (files: FileList, isComment: boolean = false) => {
    const fileArray = Array.from(files);
    const newAttachments: Attachment[] = [];

    for (const file of fileArray) {
      // Convert file to base64 for storage
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: formatFileSize(file.size),
        dataUrl: dataUrl,
      });
    }

    if (isComment) {
      setCommentAttachments([...commentAttachments, ...newAttachments]);
    } else {
      setNewPostAttachments([...newPostAttachments, ...newAttachments]);
    }
  };

  const removeAttachment = (id: string, isComment: boolean = false) => {
    if (isComment) {
      setCommentAttachments(commentAttachments.filter((a) => a.id !== id));
    } else {
      setNewPostAttachments(newPostAttachments.filter((a) => a.id !== id));
    }
  };

  const downloadAttachment = (attachment: Attachment) => {
    const a = document.createElement('a');
    a.href = attachment.dataUrl;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isImageType = (type: string): boolean => {
    return type.startsWith('image/');
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePostForm()) {
      return;
    }

    try {
      await communityAPI.createPost({
        name: newPostName.trim(),
        message: newPostMessage.trim(),
        attachments: newPostAttachments,
      });

      // Reload posts from API
      await loadPosts();

      setNewPostName('');
      setNewPostMessage('');
      setNewPostAttachments([]);
      setErrors({});
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!validateCommentForm()) {
      return;
    }

    try {
      await communityAPI.addComment(postId, {
        name: commentName.trim(),
        message: commentMessage.trim(),
        attachments: commentAttachments,
      });

      // Reload posts from API
      await loadPosts();

      setCommentName('');
      setCommentMessage('');
      setCommentAttachments([]);
      setCommentingOn(null);
      setErrors({});
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleDeletePost = (postId: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'post',
      postId: postId,
      commentId: null,
    });
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'comment',
      postId: postId,
      commentId: commentId,
    });
  };

  const confirmDelete = async () => {
    try {
      if (deleteModal.type === 'post' && deleteModal.postId) {
        await communityAPI.deletePost(deleteModal.postId);
        await loadPosts();
      }
      // Note: Comment deletion would require a new backend endpoint
      // For now, comments can only be deleted by deleting the entire post
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete. Please try again.');
    }
    
    setDeleteModal({
      isOpen: false,
      type: null,
      postId: null,
      commentId: null,
    });
  };

  const cancelDelete = () => {
    setDeleteModal({
      isOpen: false,
      type: null,
      postId: null,
      commentId: null,
    });
  };

  const toggleCommentsExpanded = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-[#005EB8]">
        <h2 className="text-2xl mb-2 text-[#003087]">Community Discussion Forum</h2>
        <p className="text-gray-600">
          Share knowledge, ask questions, and collaborate with your team members on WIS Test Automation topics.
        </p>
      </div>

      {/* Create New Post */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#005EB8] to-[#003087] text-white px-6 py-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare size={20} />
            Start a Discussion
          </h3>
        </div>
        <form onSubmit={handleCreatePost} className="p-6 space-y-4">
          <div>
            <label htmlFor="post-name" className="block mb-2 text-gray-700">
              Your Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={20} />
              </div>
              <input
                id="post-name"
                type="text"
                value={newPostName}
                onChange={(e) => {
                  setNewPostName(e.target.value);
                  setErrors({ ...errors, name: undefined });
                }}
                className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005EB8] ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your name"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="post-message" className="block mb-2 text-gray-700">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="post-message"
              value={newPostMessage}
              onChange={(e) => {
                setNewPostMessage(e.target.value);
                setErrors({ ...errors, message: undefined });
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005EB8] min-h-32 ${
                errors.message ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Share your thoughts, ask a question, or start a discussion..."
            />
            {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
          </div>

          <div>
            <label className="block mb-2 text-gray-700">Attachments</label>
            <input
              id="post-attachments"
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
            />
            <label
              htmlFor="post-attachments"
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border border-gray-300"
            >
              <Paperclip size={16} />
              Add Files/Images
            </label>
          </div>

          {newPostAttachments.length > 0 && (
            <div className="space-y-2">
              {newPostAttachments.map((attachment) => (
                <div key={attachment.id}>
                  {isImageType(attachment.type) ? (
                    <div className="relative inline-block">
                      <img
                        src={attachment.dataUrl}
                        alt={attachment.name}
                        className="max-w-xs max-h-48 rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-300">
                      <Paperclip size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700 flex-1">{attachment.name}</span>
                      <span className="text-xs text-gray-500">{attachment.size}</span>
                      <button
                        type="button"
                        onClick={() => downloadAttachment(attachment)}
                        className="text-[#005EB8] hover:text-[#003087]"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 bg-[#005EB8] text-white px-6 py-3 rounded-lg hover:bg-[#003087] transition-colors"
          >
            <Send size={18} />
            Post Discussion
          </button>
        </form>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <MessageSquare className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl text-gray-600 mb-2">No discussions yet</h3>
            <p className="text-gray-500">Be the first to start a conversation!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div 
              key={post.id} 
              id={`post-${post.id}`}
              className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${
                highlightedPostId === post.id ? 'ring-4 ring-[#005EB8] ring-opacity-50' : ''
              }`}
            >
              {/* Post Header */}
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-4 border-l-4 border-[#005EB8]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#005EB8] text-white w-10 h-10 rounded-full flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{post.name}</h4>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock size={14} />
                        <span>{formatTimestamp(post.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap ml-13">{post.message}</p>
                
                {/* Post Attachments */}
                {post.attachments && post.attachments.length > 0 && (
                  <div className="ml-13 mt-3 space-y-2">
                    {post.attachments.map((attachment) => (
                      <div key={attachment.id}>
                        {isImageType(attachment.type) ? (
                          <div className="relative inline-block">
                            <img
                              src={attachment.dataUrl}
                              alt={attachment.name}
                              className="max-w-md max-h-64 rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(attachment.dataUrl, '_blank')}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300 max-w-md">
                            <Paperclip size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-700 flex-1">{attachment.name}</span>
                            <span className="text-xs text-gray-500">{attachment.size}</span>
                            <button
                              type="button"
                              onClick={() => downloadAttachment(attachment)}
                              className="text-[#005EB8] hover:text-[#003087]"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="px-6 py-4">
                {post.comments.length > 0 && (
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm text-gray-600 flex items-center gap-2">
                        <MessageCircle size={16} />
                        {post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}
                      </h5>
                      {post.comments.length > 1 && (
                        <button
                          onClick={() => toggleCommentsExpanded(post.id)}
                          className="flex items-center gap-1 text-sm text-[#005EB8] hover:text-[#003087] transition-colors"
                        >
                          {expandedPosts.has(post.id) ? (
                            <>
                              <ChevronUp size={16} />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              View All {post.comments.length} Comments
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {(expandedPosts.has(post.id) ? post.comments : post.comments.slice(0, 1)).map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-50 rounded-lg p-4 ml-6 border-l-2 border-[#005EB8]"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-[#003087] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                            <User size={16} />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 text-sm">{comment.name}</span>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock size={12} />
                              <span>{formatTimestamp(comment.timestamp)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteComment(post.id, comment.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-gray-700 text-sm ml-10 whitespace-pre-wrap">{comment.message}</p>
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="ml-10 mt-2 space-y-2">
                            {comment.attachments.map((attachment) => (
                              <div key={attachment.id}>
                                {isImageType(attachment.type) ? (
                                  <div className="relative inline-block">
                                    <img
                                      src={attachment.dataUrl}
                                      alt={attachment.name}
                                      className="max-w-sm max-h-48 rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(attachment.dataUrl, '_blank')}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300 max-w-sm">
                                    <Paperclip size={14} className="text-gray-500" />
                                    <span className="text-xs text-gray-700 flex-1">{attachment.name}</span>
                                    <span className="text-xs text-gray-500">{attachment.size}</span>
                                    <button
                                      type="button"
                                      onClick={() => downloadAttachment(attachment)}
                                      className="text-[#005EB8] hover:text-[#003087]"
                                    >
                                      <Download size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                {commentingOn === post.id ? (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block mb-1 text-sm text-gray-700">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={commentName}
                        onChange={(e) => {
                          setCommentName(e.target.value);
                          setErrors({ ...errors, name: undefined });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005EB8] ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your name"
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-gray-700">
                        Comment <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={commentMessage}
                        onChange={(e) => {
                          setCommentMessage(e.target.value);
                          setErrors({ ...errors, message: undefined });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005EB8] min-h-24 ${
                          errors.message ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Write your comment..."
                      />
                      {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <label htmlFor="comment-attachments" className="block mb-2 text-gray-700">
                        Attachments
                      </label>
                      <input
                        id={`comment-attachments-${post.id}`}
                        type="file"
                        multiple
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files, true)}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
                      />
                      <label
                        htmlFor={`comment-attachments-${post.id}`}
                        className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border border-gray-300 text-sm"
                      >
                        <Paperclip size={14} />
                        Add Files/Images
                      </label>
                    </div>

                    {commentAttachments.length > 0 && (
                      <div className="space-y-2">
                        {commentAttachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-2">
                            {isImageType(attachment.type) ? (
                              <div className="relative inline-block">
                                <img
                                  src={attachment.dataUrl}
                                  alt={attachment.name}
                                  className="max-w-xs max-h-32 rounded-lg border border-gray-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(attachment.id, true)}
                                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300">
                                <Paperclip size={14} className="text-gray-500" />
                                <span className="text-xs text-gray-700 flex-1">{attachment.name}</span>
                                <span className="text-xs text-gray-500">{attachment.size}</span>
                                <button
                                  type="button"
                                  onClick={() => downloadAttachment(attachment)}
                                  className="text-[#005EB8] hover:text-[#003087]"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(attachment.id, true)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="flex items-center gap-2 bg-[#005EB8] text-white px-4 py-2 rounded-lg hover:bg-[#003087] transition-colors text-sm"
                      >
                        <Send size={16} />
                        Post Comment
                      </button>
                      <button
                        onClick={() => {
                          setCommentingOn(null);
                          setCommentName('');
                          setCommentMessage('');
                          setCommentAttachments([]);
                          setErrors({});
                        }}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCommentingOn(post.id)}
                    className="flex items-center gap-2 text-[#005EB8] hover:text-[#003087] transition-colors text-sm"
                  >
                    <MessageCircle size={16} />
                    Add Comment
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 text-red-600 p-3 rounded-full">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {deleteModal.type === 'post' ? 'discussion' : 'comment'}?
              {deleteModal.type === 'post' && ' All comments will also be deleted.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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