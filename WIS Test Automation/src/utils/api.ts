import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-4343c471`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

// ==================== DOCUMENTS API ====================

export const documentsAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, { headers });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      return data.documents;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  upload: async (document: { name: string; size: string; type: string; dataUrl: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers,
        body: JSON.stringify(document),
      });
      if (!response.ok) throw new Error('Failed to upload document');
      const data = await response.json();
      return data.document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  update: async (id: string, updates: { category?: string; isFavorite?: boolean }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update document');
      const data = await response.json();
      return data.document;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete document');
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },
};

// ==================== PROJECT STRUCTURE API ====================

export const structureAPI = {
  getUI: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/structure/ui`, { headers });
      if (!response.ok) throw new Error('Failed to fetch UI structure');
      const data = await response.json();
      return data.structure;
    } catch (error) {
      console.error('Error fetching UI structure:', error);
      throw error;
    }
  },

  updateUI: async (structure: any[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/structure/ui`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ structure }),
      });
      if (!response.ok) throw new Error('Failed to update UI structure');
      return true;
    } catch (error) {
      console.error('Error updating UI structure:', error);
      throw error;
    }
  },

  getAPI: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/structure/api`, { headers });
      if (!response.ok) throw new Error('Failed to fetch API structure');
      const data = await response.json();
      return data.structure;
    } catch (error) {
      console.error('Error fetching API structure:', error);
      throw error;
    }
  },

  updateAPI: async (structure: any[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/structure/api`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ structure }),
      });
      if (!response.ok) throw new Error('Failed to update API structure');
      return true;
    } catch (error) {
      console.error('Error updating API structure:', error);
      throw error;
    }
  },
};

// ==================== COMMUNITY API ====================

export const communityAPI = {
  getPosts: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/community/posts`, { headers });
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      return data.posts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  createPost: async (post: { name: string; message: string; attachments?: any[] }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/community/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(post),
      });
      if (!response.ok) throw new Error('Failed to create post');
      const data = await response.json();
      return data.post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  addComment: async (postId: string, comment: { name: string; message: string; attachments?: any[] }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/community/posts/${postId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(comment),
      });
      if (!response.ok) throw new Error('Failed to add comment');
      const data = await response.json();
      return data.comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  deletePost: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/community/posts/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete post');
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },
};