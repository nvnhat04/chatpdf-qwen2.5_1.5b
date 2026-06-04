import os
import re
from typing import Dict, List

import pdfplumber


class PDFProcessor:
    """Xử lý trích xuất và chuẩn bị dữ liệu từ PDF"""
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.documents = []
        
    def extract_text(self) -> List[Dict[str, str]]:
        """Trích xuất text từ PDF"""
        with pdfplumber.open(self.pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text.strip():
                    self.documents.append({
                        'page': page_num + 1,
                        'content': text
                    })
        print(f"✓ Trích xuất {len(self.documents)} trang từ PDF")
        return self.documents
    
    def chunk_text(self, chunk_size: int = 500, overlap: int = 100) -> List[Dict[str, str]]:
        """Chia nhỏ text thành chunks để xử lý"""
        chunks = []
        chunk_id = 0
        
        for doc in self.documents:
            text = doc['content']
            # Chia text dựa trên sentences
            sentences = re.split(r'(?<=[.!?])\s+', text)
            
            current_chunk = ""
            for sentence in sentences:
                if len(current_chunk) + len(sentence) < chunk_size:
                    current_chunk += " " + sentence
                else:
                    if current_chunk.strip():
                        chunks.append({
                            'id': chunk_id,
                            'page': doc['page'],
                            'content': current_chunk.strip()
                        })
                        chunk_id += 1
                    # Overlap: giữ lại phần cuối của chunk trước đó
                    current_chunk = current_chunk[-overlap:] + " " + sentence
            
            # Thêm chunk cuối cùng
            if current_chunk.strip():
                chunks.append({
                    'id': chunk_id,
                    'page': doc['page'],
                    'content': current_chunk.strip()
                })
                chunk_id += 1
        
        print(f"✓ Chia thành {len(chunks)} chunks")
        return chunks


if __name__ == "__main__":
    processor = PDFProcessor("docs/KLTN_NguyenVanNhat.pdf")
    docs = processor.extract_text()
    chunks = processor.chunk_text()
    print(f"Sample chunk: {chunks[0] if chunks else 'Không có chunk'}")
