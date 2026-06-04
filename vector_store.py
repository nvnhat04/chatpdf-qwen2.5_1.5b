import os
import pickle
from typing import Dict, List, Tuple

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer


class VectorStore:
    """Lưu trữ vectors và thực hiện similarity search"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.embedding_model = SentenceTransformer(model_name)
        self.dimension = self.embedding_model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatL2(self.dimension)
        self.documents = []
        
    def add_documents(self, chunks: List[Dict[str, str]]) -> None:
        """Thêm documents vào vector store"""
        if not chunks:
            print("⚠ Không có chunks để thêm")
            return
            
        contents = [chunk['content'] for chunk in chunks]
        print(f"🔄 Encoding {len(chunks)} chunks...")
        
        embeddings = self.embedding_model.encode(contents, show_progress_bar=True)
        embeddings = np.array(embeddings).astype('float32')
        
        self.index.add(embeddings)
        self.documents = chunks
        print(f"✓ Đã thêm {len(chunks)} documents vào vector store")
        
    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Tìm kiếm các documents liên quan"""
        query_embedding = self.embedding_model.encode([query])
        query_embedding = np.array(query_embedding).astype('float32')
        
        distances, indices = self.index.search(query_embedding, top_k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.documents):
                results.append({
                    'score': float(distances[0][i]),
                    'content': self.documents[idx]['content'],
                    'page': self.documents[idx]['page'],
                    'chunk_id': self.documents[idx]['id']
                })
        return results
    
    def save(self, path: str) -> None:
        """Lưu index và documents"""
        os.makedirs(path, exist_ok=True)
        faiss.write_index(self.index, f"{path}/faiss_index.bin")
        with open(f"{path}/documents.pkl", 'wb') as f:
            pickle.dump(self.documents, f)
        print(f"✓ Đã lưu vector store tại {path}")
        
    def load(self, path: str) -> None:
        """Tải index và documents"""
        self.index = faiss.read_index(f"{path}/faiss_index.bin")
        with open(f"{path}/documents.pkl", 'rb') as f:
            self.documents = pickle.load(f)
        print(f"✓ Đã tải vector store từ {path}")


class RAGRetriever:
    """Kết hợp retrieval với generation"""
    
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        
    def retrieve_context(self, query: str, top_k: int = 5) -> Tuple[str, List[Dict]]:
        """Lấy context từ PDF dựa trên query"""
        results = self.vector_store.search(query, top_k)
        
        # Nối context từ các chunks tốt nhất
        context_parts = []
        for result in results:
            context_parts.append(
                f"[Trang {result['page']}]: {result['content']}"
            )
        
        context = "\n\n".join(context_parts)
        return context, results


if __name__ == "__main__":
    from pdf_processor import PDFProcessor

    # Test
    processor = PDFProcessor("docs/KLTN_NguyenVanNhat.pdf")
    chunks = processor.chunk_text()
    
    vector_store = VectorStore()
    vector_store.add_documents(chunks)
    
    retriever = RAGRetriever(vector_store)
    context, results = retriever.retrieve_context("Transformer là gì")
    
    print("\n📚 Context truy xuất được:")
    print(context[:500])
