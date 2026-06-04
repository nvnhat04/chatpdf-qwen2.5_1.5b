#!/usr/bin/env python3
"""
Quick Start: PDF Chatbot với Qwen2.5-1.5b
Run: python quick_start.py
"""

import os
import sys
from pathlib import Path


def check_requirements():
    """Kiểm tra yêu cầu hệ thống"""
    print("🔍 Kiểm tra yêu cầu hệ thống...")
    
    # Check Python version
    if sys.version_info < (3, 10):
        print("❌ Python 3.10+ được yêu cầu")
        return False
    print("✅ Python version OK")
    
    # Check PDF exists
    if not os.path.exists("D:/Github/LLM/docs/KLTN_NguyenVanNhat.pdf"):
        print("❌ Không tìm thấy PDF: D:/Github/LLM/docs/KLTN_NguyenVanNhat.pdf")
        return False
    print("✅ PDF file found")
    
    # Check model exists
    if not os.path.exists("D:\\Github\\LLM\\models\\qwen2.5-1.5b"):
        print("❌ Không tìm thấy model")
        return False
    print("✅ Model found")
    
    # Check packages
    packages = [
        'transformers', 'torch', 'pdfplumber', 
        'sentence_transformers', 'faiss', 'numpy'
    ]
    missing = []
    for package in packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"❌ Missing packages: {', '.join(missing)}")
        print("Run: pip install -r requirements.txt")
        return False
    print("✅ All packages installed")
    
    return True


def main():
    print("=" * 60)
    print("🤖 PDF CHATBOT - QUICK START")
    print("=" * 60)
    
    # Check requirements
    if not check_requirements():
        print("\n⚠️  Vui lòng cài đặt yêu cầu trước khi tiếp tục")
        return
    
    print("\n✅ Tất cả kiểm tra đã pass!\n")
    
    # Change to correct directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if os.path.basename(script_dir) != "chatbot_uet":
        os.chdir(script_dir)
    
    # Import and run
    try:
        print("📥 Importing modules...")
        from pdf_processor import PDFProcessor
        from qwen_model import QwenChatbot
        from vector_store import RAGRetriever, VectorStore
        print("✓ Modules imported")
        
        print("\n📄 Loading PDF (KLTN_NguyenVanNhat.pdf)...")
        pdf_path = "../docs/KLTN_NguyenVanNhat.pdf"
        if not os.path.exists(pdf_path):
            print(f"❌ PDF not found at: {os.path.abspath(pdf_path)}")
            return
        processor = PDFProcessor(pdf_path)
        documents = processor.extract_text()
        print(f"✓ Extracted {len(documents)} pages")
        
        print("\n📦 Chunking documents...")
        chunks = processor.chunk_text(chunk_size=500, overlap=100)
        print(f"✓ Created {len(chunks)} chunks")
        
        # Check cache
        embeddings_path = "./embeddings"
        if os.path.exists(embeddings_path) and os.path.exists(f"{embeddings_path}/faiss_index.bin"):
            print("\n🔢 Loading cached embeddings...")
            vector_store = VectorStore()
            vector_store.load(embeddings_path)
            print("✓ Embeddings loaded from cache")
        else:
            print("\n🔢 Creating embeddings (this may take a moment)...")
            vector_store = VectorStore()
            vector_store.add_documents(chunks)
            vector_store.save(embeddings_path)
            print("✓ Embeddings created and saved")
        
        print("\n🔗 Setting up retriever...")
        retriever = RAGRetriever(vector_store)
        print("✓ Retriever ready")
        
        print("\n🤖 Loading Qwen model...")
        model_path = "D:\\Github\\LLM\\models\\qwen2.5-1.5b"
        if not os.path.exists(model_path):
            print(f"❌ Model not found at: {model_path}")
            return
        
        try:
            chatbot = QwenChatbot(model_path)
            print("✓ Model loaded and ready")
        except Exception as model_error:
            print(f"\n❌ Failed to load model: {model_error}")
            print("\n💡 Troubleshooting:")
            print("   1. Check CUDA memory: nvidia-smi")
            print("   2. Try reducing max_tokens or using CPU")
            print("   3. Check if model files are complete")
            import traceback
            traceback.print_exc()
            return
        
        print("\n" + "=" * 60)
        print("✅ SETUP COMPLETE!")
        print("=" * 60)
        print("\n💬 Interactive Chat Mode")
        print("Type 'exit' or 'quit' to leave\n")
        
        # Chat loop
        while True:
            try:
                user_query = input("👤 You: ").strip()
                
                if user_query.lower() in ['exit', 'quit', 'q']:
                    print("\n👋 Goodbye!")
                    break
                
                if not user_query:
                    continue
                
                print("\n⏳ Thinking...", end="", flush=True)
                
                # Retrieve context
                context, sources = retriever.retrieve_context(user_query, top_k=5)
                print("\r" + " " * 20 + "\r", end="")  # Clear thinking message
                
                # Generate response
                response = chatbot.generate_response(user_query, context)
                
                print(f"🤖 Bot: {response}\n")
                
                # Show sources
                print("📚 Sources:")
                for i, source in enumerate(sources, 1):
                    relevance = 1 / (1 + source['score'])
                    print(f"   {i}. Page {source['page']} ({relevance:.0%} relevant)")
                print()
                
            except KeyboardInterrupt:
                print("\n\n👋 Interrupted by user")
                break
            except Exception as chat_error:
                print(f"\n❌ Chat error: {chat_error}")
                print("💡 Try asking a different question or type 'quit' to exit\n")
            
    except Exception as e:
        print(f"\n❌ Setup Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()
