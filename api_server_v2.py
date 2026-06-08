#!/usr/bin/env python3
"""
FastAPI Server with PDF Upload - Expose PDF Chatbot as REST API with multi-PDF support
Run: python api_server.py
Access: http://localhost:8000/docs
"""

import hashlib
import os
import shutil
import sys
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from pdf_processor import PDFProcessor
from qwen_model import QwenChatbot
from vector_store import RAGRetriever, VectorStore

# Initialize FastAPI app
app = FastAPI(
    title="PDF Chatbot API",
    description="REST API for PDF-based Q&A chatbot with upload support",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    top_k: int = 5
    max_tokens: int = 512
    temperature: float = 0.7


class SourceInfo(BaseModel):
    page: int
    content: str
    score: float
    relevance: float


class ChatResponse(BaseModel):
    query: str
    response: str
    sources: List[SourceInfo]
    processing_time: float


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    gpu_available: bool
    pdf_file: Optional[str]


class UploadResponse(BaseModel):
    session_id: str
    filename: str
    file_size: int
    num_chunks: int
    status: str
    message: str


class SessionInfo(BaseModel):
    session_id: str
    filename: str
    file_size: int
    num_chunks: int
    created_at: str
    ready: bool


# Global state
app_state = {
    "default_chatbot": None,
    "default_retriever": None,
    "sessions": {},  # session_id -> {chatbot, retriever, pdf_path, filename}
    "error": None
}


def get_session_id_from_filename(filename: str) -> str:
    """Generate session ID from filename"""
    hash_obj = hashlib.md5((filename + str(datetime.now())).encode())
    return hash_obj.hexdigest()[:16]


@app.on_event("startup")
async def startup_event():
    """Initialize default chatbot on server startup"""
    print("🚀 Starting PDF Chatbot API Server...")
    
    try:
        # Load default PDF
        pdf_path = "../docs/KLTN_NguyenVanNhat.pdf"
        
        if not os.path.exists(pdf_path):
            print(f"⚠️  Default PDF not found: {pdf_path}")
            app_state["error"] = f"Default PDF not found: {pdf_path}"
            return
        
        print("📄 Loading default PDF...")
        processor = PDFProcessor(pdf_path)
        documents = processor.extract_text()
        chunks = processor.chunk_text(chunk_size=500, overlap=100)
        
        print("🔢 Loading embeddings...")
        embeddings_path = "./embeddings"
        
        if os.path.exists(embeddings_path) and os.path.exists(f"{embeddings_path}/faiss_index.bin"):
            print("📂 Using cached embeddings")
            vector_store = VectorStore()
            vector_store.load(embeddings_path)
        else:
            print("⏳ Creating embeddings (first time only)...")
            vector_store = VectorStore()
            vector_store.add_documents(chunks)
            vector_store.save(embeddings_path)
        
        app_state["default_retriever"] = RAGRetriever(vector_store)
        
        print("🤖 Loading Qwen model...")
        model_path = "D:\\Github\\LLM\\models\\qwen2.5-1.5b"
        app_state["default_chatbot"] = QwenChatbot(model_path)
        
        print("✅ Default chatbot initialized successfully!")
        print(f"📊 Loaded {len(chunks)} chunks from PDF")
        
    except Exception as e:
        app_state["error"] = str(e)
        print(f"❌ Startup error: {e}")
        import traceback
        traceback.print_exc()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    import torch
    
    return HealthResponse(
        status="ready" if app_state["default_chatbot"] is not None else "initializing",
        model_loaded=app_state["default_chatbot"] is not None,
        gpu_available=torch.cuda.is_available(),
        pdf_file="KLTN_NguyenVanNhat.pdf"
    )


@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """Upload and process a PDF file"""
    
    if not app_state["default_chatbot"]:
        raise HTTPException(
            status_code=503,
            detail="Chatbot not ready. Please try again later."
        )
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    session_id = get_session_id_from_filename(file.filename)
    
    try:
        # Create temp directory for this session
        temp_dir = Path(tempfile.gettempdir()) / f"pdf_chatbot_{session_id}"
        temp_dir.mkdir(exist_ok=True)
        
        # Save uploaded file
        pdf_path = temp_dir / file.filename
        with open(pdf_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        file_size = len(content)
        
        print(f"\n📥 Processing uploaded PDF: {file.filename}")
        
        # Process PDF
        processor = PDFProcessor(str(pdf_path))
        documents = processor.extract_text()
        chunks = processor.chunk_text(chunk_size=500, overlap=100)
        
        print(f"📦 Creating embeddings for {len(chunks)} chunks...")
        
        # Create vector store for this session
        vector_store = VectorStore()
        vector_store.add_documents(chunks)
        
        # Save session
        app_state["sessions"][session_id] = {
            "chatbot": app_state["default_chatbot"],
            "retriever": RAGRetriever(vector_store),
            "vector_store": vector_store,
            "pdf_path": str(pdf_path),
            "filename": file.filename,
            "file_size": file_size,
            "num_chunks": len(chunks),
            "created_at": datetime.now().isoformat(),
            "ready": True
        }
        
        print(f"✅ PDF processed successfully! Session ID: {session_id}")
        
        return UploadResponse(
            session_id=session_id,
            filename=file.filename,
            file_size=file_size,
            num_chunks=len(chunks),
            status="success",
            message=f"PDF uploaded and processed successfully. {len(chunks)} chunks created."
        )
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@app.get("/sessions/{session_id}", response_model=SessionInfo)
async def get_session_info(session_id: str):
    """Get information about a session"""
    
    if session_id not in app_state["sessions"]:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = app_state["sessions"][session_id]
    
    return SessionInfo(
        session_id=session_id,
        filename=session["filename"],
        file_size=session["file_size"],
        num_chunks=session["num_chunks"],
        created_at=session["created_at"],
        ready=session["ready"]
    )


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and cleanup files"""
    
    if session_id not in app_state["sessions"]:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        session = app_state["sessions"][session_id]
        pdf_path = Path(session["pdf_path"])
        
        # Delete temp files
        if pdf_path.exists():
            temp_dir = pdf_path.parent
            shutil.rmtree(temp_dir)
        
        # Remove session
        del app_state["sessions"][session_id]
        
        return {"status": "success", "message": f"Session {session_id} deleted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting session: {str(e)}")


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with PDF chatbot"""
    import time

    # Get retriever and chatbot
    if request.session_id and request.session_id in app_state["sessions"]:
        session = app_state["sessions"][request.session_id]
        retriever = session["retriever"]
        chatbot = session["chatbot"]
    elif app_state["default_chatbot"]:
        retriever = app_state["default_retriever"]
        chatbot = app_state["default_chatbot"]
    else:
        raise HTTPException(
            status_code=503,
            detail="Chatbot not ready. Please upload a PDF or check server status."
        )
    
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    start_time = time.time()
    
    try:
        # Retrieve context
        context, sources = retriever.retrieve_context(
            request.query,
            top_k=request.top_k
        )
        
        # Generate response
        response = chatbot.generate_response(
            request.query,
            context,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        # Format sources
        formatted_sources = [
            SourceInfo(
                page=source["page"],
                content=source["content"][:200],  # Truncate to 200 chars
                score=source["score"],
                relevance=1 / (1 + source["score"])
            )
            for source in sources
        ]
        
        processing_time = time.time() - start_time
        
        return ChatResponse(
            query=request.query,
            response=response,
            sources=formatted_sources,
            processing_time=processing_time
        )
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/info")
async def get_info():
    """Get chatbot information"""
    
    session_count = len(app_state["sessions"])
    
    return {
        "name": "PDF Chatbot",
        "version": "2.0.0",
        "model": "Qwen2.5-1.5b",
        "features": [
            "Default PDF support",
            "Custom PDF upload",
            "Multi-session support",
            "Source attribution",
            "RAG-based Q&A"
        ],
        "status": "ready" if app_state["default_chatbot"] else "loading",
        "active_sessions": session_count,
        "endpoints": [
            "GET /health - Health check",
            "POST /chat - Chat with chatbot",
            "POST /upload - Upload PDF file",
            "GET /sessions/{session_id} - Get session info",
            "DELETE /sessions/{session_id} - Delete session",
            "GET /docs - Swagger API documentation"
        ]
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to PDF Chatbot API v2.0 (with upload support)",
        "docs": "Visit http://localhost:8000/docs for API documentation",
        "health": "Check http://localhost:8000/health for server status",
        "features": [
            "Upload custom PDF files",
            "Chat with multiple PDFs (different sessions)",
            "View session information",
            "Delete sessions to free resources"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("🚀 PDF CHATBOT - FASTAPI SERVER v2.0 (With Upload)")
    print("="*60)
    print("\n📍 API will be available at:")
    print("   - Main: http://localhost:8000")
    print("   - Docs: http://localhost:8000/docs")
    print("   - Health: http://localhost:8000/health")
    print("\n✨ Features:")
    print("   - Default PDF support (KLTN_NguyenVanNhat.pdf)")
    print("   - Upload custom PDF files")
    print("   - Multi-session support")
    print("\nPress Ctrl+C to stop\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
