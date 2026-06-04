import os
import sys
from pathlib import Path
from typing import Dict

# Import các modules
from pdf_processor import PDFProcessor
from qwen_model import QwenChatbot
from vector_store import RAGRetriever, VectorStore


class PDFChatbotBuilder:
    """Pipeline xây dựng PDF chatbot end-to-end"""
    
    def __init__(self, 
                 pdf_path: str,
                 model_path: str,
                 embeddings_dir: str = "chatbot_uet/embeddings"):
        self.pdf_path = pdf_path
        self.model_path = model_path
        self.embeddings_dir = embeddings_dir
        
        self.processor = None
        self.vector_store = None
        self.retriever = None
        self.chatbot = None
        
    def step1_extract_pdf(self):
        """Bước 1: Trích xuất PDF"""
        print("\n" + "="*60)
        print("BƯỚC 1: Trích xuất PDF")
        print("="*60)
        
        self.processor = PDFProcessor(self.pdf_path)
        self.processor.extract_text()
        return self.processor.documents
        
    def step2_chunk_documents(self, chunk_size: int = 500, overlap: int = 100):
        """Bước 2: Chia nhỏ documents"""
        print("\n" + "="*60)
        print("BƯỚC 2: Chia nhỏ documents thành chunks")
        print("="*60)
        
        chunks = self.processor.chunk_text(chunk_size, overlap)
        print(f"📊 Thông tin chunks:")
        print(f"   - Tổng chunks: {len(chunks)}")
        print(f"   - Chunk đầu tiên: {chunks[0]['content'][:100]}...")
        return chunks
        
    def step3_create_embeddings(self, chunks, use_cached: bool = True):
        """Bước 3: Tạo embeddings"""
        print("\n" + "="*60)
        print("BƯỚC 3: Tạo embeddings và vector store")
        print("="*60)
        
        # Kiểm tra có embeddings cached không
        if use_cached and os.path.exists(self.embeddings_dir):
            print(f"📂 Phát hiện embeddings cached tại {self.embeddings_dir}")
            self.vector_store = VectorStore()
            self.vector_store.load(self.embeddings_dir)
        else:
            print("🔨 Tạo embeddings mới...")
            self.vector_store = VectorStore()
            self.vector_store.add_documents(chunks)
            self.vector_store.save(self.embeddings_dir)
            
    def step4_setup_retriever(self):
        """Bước 4: Thiết lập retriever"""
        print("\n" + "="*60)
        print("BƯỚC 4: Thiết lập RAG Retriever")
        print("="*60)
        
        self.retriever = RAGRetriever(self.vector_store)
        print("✓ Retriever sẵn sàng")
        
    def step5_load_model(self):
        """Bước 5: Tải Qwen model"""
        print("\n" + "="*60)
        print("BƯỚC 5: Tải Qwen2.5-1.5b model")
        print("="*60)
        
        try:
            self.chatbot = QwenChatbot(self.model_path)
            print("✓ Model sẵn sàng")
        except Exception as e:
            print(f"\n❌ Lỗi tải model: {e}")
            print("\n💡 Giải pháp:")
            print("   1. Kiểm tra bộ nhớ GPU: nvidia-smi")
            print("   2. Thử giảm max_tokens hoặc dùng CPU")
            print("   3. Kiểm tra xem file model có đầy đủ không")
            raise
        
    def build(self, chunk_size: int = 500):
        """Build toàn bộ chatbot"""
        print("\n🚀 BẮT ĐẦU XÂY DỰNG PDF CHATBOT")
        print("=" * 60)
        
        # Bước 1: Trích xuất PDF
        self.step1_extract_pdf()
        
        # Bước 2: Chia chunks
        chunks = self.step2_chunk_documents(chunk_size)
        
        # Bước 3: Tạo embeddings
        self.step3_create_embeddings(chunks)
        
        # Bước 4: Setup retriever
        self.step4_setup_retriever()
        
        # Bước 5: Tải model
        self.step5_load_model()
        
        print("\n" + "="*60)
        print("✅ HOÀN TẤT! Chatbot sẵn sàng sử dụng")
        print("="*60)
        
    def chat(self, user_query: str, top_k: int = 5) -> Dict:
        """Chat với chatbot"""
        # Retrieve context
        context, search_results = self.retriever.retrieve_context(user_query, top_k)
        
        # Generate response
        response = self.chatbot.generate_response(user_query, context)
        
        return {
            'query': user_query,
            'response': response,
            'context_sources': search_results
        }


def main():
    """Main execution"""
    # Paths
    print("\n📁 NHẬP ĐƯỜNG DẪN")
    pdf_path = input("Nhập đường dẫn đến file PDF: ").strip()
    # model_path = input("Nhập đường dẫn đến model: ").strip()

    # pdf_path = "D:\\Github\\LLM\\docs\\KLTN_NguyenVanNhat.pdf"
    model_path = "D:\\Github\\LLM\\models\\qwen2.5-1.5b"
    # Check paths
    if not os.path.exists(pdf_path):
        print(f"❌ Không tìm thấy PDF: {pdf_path}")
        return
    
    if not os.path.exists(model_path):
        print(f"❌ Không tìm thấy model: {model_path}")
        return
    
    # Build chatbot
    try:
        builder = PDFChatbotBuilder(pdf_path, model_path)
        builder.build(chunk_size=500)
    except Exception as build_error:
        print(f"\n❌ Lỗi khi xây dựng chatbot: {build_error}")
        import traceback
        traceback.print_exc()
        return
    
    # Interactive chat
    print("\n💬 BẮT ĐẦU CHAT (gõ 'exit' để thoát)")
    print("-" * 60)
    
    while True:
        try:
            user_input = input("\n👤 Bạn: ").strip()
            
            if user_input.lower() in ['exit', 'quit', 'q']:
                print("👋 Tạm biệt!")
                break
            
            if not user_input:
                continue
            
            print("\n⏳ Đang xử lý...")
            result = builder.chat(user_input)
            
            print(f"\n🤖 Chatbot: {result['response']}")
            # print(f"\n📚 Nguồn tham khảo:")
            # for i, source in enumerate(result['context_sources'], 1):
            #     print(f"   {i}. Trang {source['page']} (Độ liên quan: {1/(1+source['score']):.2%})")
                
        except KeyboardInterrupt:
            print("\n\n👋 Đã dừng")
            break
        except Exception as chat_error:
            print(f"\n❌ Lỗi: {chat_error}")
            print("💡 Hãy thử câu hỏi khác hoặc gõ 'quit' để thoát\n")


if __name__ == "__main__":
    main()
