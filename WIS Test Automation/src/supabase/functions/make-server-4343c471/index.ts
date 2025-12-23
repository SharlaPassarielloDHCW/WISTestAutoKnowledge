import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-4343c471/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== DOCUMENTS ENDPOINTS ====================

// Get all documents
app.get("/make-server-4343c471/documents", async (c) => {
  try {
    const documents = await kv.get("wis-documents");
    return c.json({ documents: documents || [] });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return c.json({ error: "Failed to fetch documents", details: String(error) }, 500);
  }
});

// Upload document
app.post("/make-server-4343c471/documents", async (c) => {
  try {
    const body = await c.req.json();
    const { name, size, type, dataUrl, uploadedAt, category, isFavorite } = body;
    
    if (!name || !dataUrl) {
      return c.json({ error: "Missing required fields: name and dataUrl" }, 400);
    }

    const documents = await kv.get("wis-documents") || [];
    const newDocument = {
      id: crypto.randomUUID(),
      name,
      size,
      type,
      dataUrl,
      uploadedAt: uploadedAt || new Date().toISOString(),
      category: category || "Uncategorized",
      isFavorite: isFavorite || false,
    };

    documents.push(newDocument);
    await kv.set("wis-documents", documents);

    return c.json({ document: newDocument, message: "Document uploaded successfully" });
  } catch (error) {
    console.error("Error uploading document:", error);
    return c.json({ error: "Failed to upload document", details: String(error) }, 500);
  }
});

// Delete document
app.delete("/make-server-4343c471/documents/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const documents = await kv.get("wis-documents") || [];
    
    const filteredDocuments = documents.filter((doc: any) => doc.id !== id);
    
    if (filteredDocuments.length === documents.length) {
      return c.json({ error: "Document not found" }, 404);
    }

    await kv.set("wis-documents", filteredDocuments);
    return c.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return c.json({ error: "Failed to delete document", details: String(error) }, 500);
  }
});

// Update document (for favorites, category, etc.)
app.put("/make-server-4343c471/documents/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const documents = await kv.get("wis-documents") || [];
    
    const docIndex = documents.findIndex((doc: any) => doc.id === id);
    
    if (docIndex === -1) {
      return c.json({ error: "Document not found" }, 404);
    }

    // Update document with new fields
    documents[docIndex] = {
      ...documents[docIndex],
      ...body,
      id, // Ensure ID doesn't change
    };

    await kv.set("wis-documents", documents);
    return c.json({ document: documents[docIndex], message: "Document updated successfully" });
  } catch (error) {
    console.error("Error updating document:", error);
    return c.json({ error: "Failed to update document", details: String(error) }, 500);
  }
});

// ==================== PROJECT STRUCTURE ENDPOINTS ====================

// Get UI structure
app.get("/make-server-4343c471/structure/ui", async (c) => {
  try {
    const structure = await kv.get("wis-ui-structure");
    return c.json({ structure: structure || [] });
  } catch (error) {
    console.error("Error fetching UI structure:", error);
    return c.json({ error: "Failed to fetch UI structure", details: String(error) }, 500);
  }
});

// Update UI structure
app.post("/make-server-4343c471/structure/ui", async (c) => {
  try {
    const body = await c.req.json();
    const { structure } = body;
    
    if (!structure) {
      return c.json({ error: "Missing required field: structure" }, 400);
    }

    await kv.set("wis-ui-structure", structure);
    return c.json({ message: "UI structure updated successfully" });
  } catch (error) {
    console.error("Error updating UI structure:", error);
    return c.json({ error: "Failed to update UI structure", details: String(error) }, 500);
  }
});

// Get API structure
app.get("/make-server-4343c471/structure/api", async (c) => {
  try {
    const structure = await kv.get("wis-api-structure");
    return c.json({ structure: structure || [] });
  } catch (error) {
    console.error("Error fetching API structure:", error);
    return c.json({ error: "Failed to fetch API structure", details: String(error) }, 500);
  }
});

// Update API structure
app.post("/make-server-4343c471/structure/api", async (c) => {
  try {
    const body = await c.req.json();
    const { structure } = body;
    
    if (!structure) {
      return c.json({ error: "Missing required field: structure" }, 400);
    }

    await kv.set("wis-api-structure", structure);
    return c.json({ message: "API structure updated successfully" });
  } catch (error) {
    console.error("Error updating API structure:", error);
    return c.json({ error: "Failed to update API structure", details: String(error) }, 500);
  }
});

// ==================== COMMUNITY ENDPOINTS ====================

// Get all community posts
app.get("/make-server-4343c471/community/posts", async (c) => {
  try {
    const posts = await kv.get("wis-community-posts");
    return c.json({ posts: posts || [] });
  } catch (error) {
    console.error("Error fetching community posts:", error);
    return c.json({ error: "Failed to fetch community posts", details: String(error) }, 500);
  }
});

// Create new community post
app.post("/make-server-4343c471/community/posts", async (c) => {
  try {
    const body = await c.req.json();
    const { name, message, attachments } = body;
    
    if (!name || !message) {
      return c.json({ error: "Missing required fields: name and message" }, 400);
    }

    const posts = await kv.get("wis-community-posts") || [];
    const newPost = {
      id: crypto.randomUUID(),
      name,
      message,
      timestamp: new Date().toISOString(),
      attachments: attachments || [],
      comments: [],
    };

    posts.push(newPost);
    await kv.set("wis-community-posts", posts);

    return c.json({ post: newPost, message: "Post created successfully" });
  } catch (error) {
    console.error("Error creating community post:", error);
    return c.json({ error: "Failed to create post", details: String(error) }, 500);
  }
});

// Add comment to post
app.post("/make-server-4343c471/community/posts/:id/comments", async (c) => {
  try {
    const postId = c.req.param("id");
    const body = await c.req.json();
    const { name, message, attachments } = body;
    
    if (!name || !message) {
      return c.json({ error: "Missing required fields: name and message" }, 400);
    }

    const posts = await kv.get("wis-community-posts") || [];
    const postIndex = posts.findIndex((p: any) => p.id === postId);
    
    if (postIndex === -1) {
      return c.json({ error: "Post not found" }, 404);
    }

    const newComment = {
      id: crypto.randomUUID(),
      name,
      message,
      timestamp: new Date().toISOString(),
      attachments: attachments || [],
    };

    posts[postIndex].comments.push(newComment);
    await kv.set("wis-community-posts", posts);

    return c.json({ comment: newComment, message: "Comment added successfully" });
  } catch (error) {
    console.error("Error adding comment:", error);
    return c.json({ error: "Failed to add comment", details: String(error) }, 500);
  }
});

// Delete community post
app.delete("/make-server-4343c471/community/posts/:id", async (c) => {
  try {
    const postId = c.req.param("id");
    const posts = await kv.get("wis-community-posts") || [];
    
    const filteredPosts = posts.filter((p: any) => p.id !== postId);
    
    if (filteredPosts.length === posts.length) {
      return c.json({ error: "Post not found" }, 404);
    }

    await kv.set("wis-community-posts", filteredPosts);
    return c.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return c.json({ error: "Failed to delete post", details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
