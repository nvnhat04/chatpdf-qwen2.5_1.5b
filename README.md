# 🤖 PDF Chatbot với Qwen2.5-1.5b

## 🚀 Quick Start (Bắt Đầu Nhanh)

### Cách 1: Chạy Quick Start Script (Khuyến Nghị)
```bash
cd d:\Github\LLM\chatbot_uet
python quick_start.py
```

### Cách 2: Chạy Main Pipeline
```bash
cd d:\Github\LLM
python chatbot_uet/main.py
```

---

## 📦 File Structure

```
chatbot_uet/
├── pdf_processor.py       # PDF text extraction & chunking
├── vector_store.py        # Embedding & RAG retrieval  
├── qwen_model.py          # Qwen model integration
├── main.py                # Full pipeline
├── quick_start.py         # Quick setup & chat
├── config.ini             # Configuration
├── embeddings/            # Cached embeddings (auto-created)
├── chat_history.json      # Chat history (auto-created)
└── README.md              # This file
```

---

## 🔧 Setup từng Bước

### 1️⃣ Cài đặt Python & Packages
```bash
# Tạo virtual environment
python -m venv venv
venv\Scripts\activate

# Cài dependencies
cd d:\Github\LLM
pip install -r requirements.txt
```

### 2️⃣ Kiểm tra Cài Đặt
```bash
python -c "import torch; print(torch.__version__); print(f'GPU: {torch.cuda.is_available()}')"
```

### 3️⃣ Chạy Chatbot
```bash
cd chatbot_uet
python quick_start.py
```

---

## 📋 Các Bước Bên Trong Chatbot

### 1. **PDF Processing** (pdf_processor.py)
- Đọc PDF dùng pdfplumber
- Trích xuất text từ tất cả trang
- Chia text thành chunks (500 tokens/chunk)

### 2. **Embedding** (vector_store.py)
- Encode chunks dùng SentenceTransformer
- Xây dựng FAISS index để tìm kiếm nhanh
- Cache embeddings để tái sử dụng

### 3. **Retrieval** (vector_store.py)
- Encode câu hỏi thành vector
- Tìm 5 chunks tương tự nhất (similarity search)
- Nối chunks làm context

### 4. **Generation** (qwen_model.py)
- Pass context + câu hỏi cho Qwen
- Model sinh câu trả lời
- Extract + format output

---

## 💬 Ví Dụ Sử Dụng

```
👤 You: Tóm tắt luận văn này?

⏳ Thinking...

🤖 Bot: Luận văn tốt nghiệp này tập trung vào [content]...

📚 Sources:
   1. Page 1 (100% relevant)
   2. Page 3 (89% relevant)
   3. Page 5 (76% relevant)
```

---

## ⚙️ Tuning Parameters

### Trong `quick_start.py` hoặc `main.py`:

```python
# Số lượng chunks để retrieve
retriever.retrieve_context(query, top_k=10)  # ↑ Nhiều hơn

# Kích thước chunk
processor.chunk_text(chunk_size=300)  # ↓ Nhỏ hơn = chi tiết hơn

# Response generation
chatbot.generate_response(
    query, 
    context,
    max_tokens=256,      # ↓ Giảm nếu GPU memory hạn chế
    temperature=0.5      # ↓ Hạ = trả lời factual hơn
)
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| ModuleNotFoundError | `pip install -r requirements.txt` |
| GPU Out of Memory | Dùng CPU hoặc giảm max_tokens |
| Slow embedding | GPU + lần thứ 2 sẽ dùng cache |
| Poor answer quality | ↑ top_k, ↓ chunk_size, ↓ temperature |

---

## 📊 Performance

- **Lần 1**: ~90 giây (trích xuất + embedding + load model)
- **Lần 2+**: ~20 giây (dùng cache embeddings)
- **Per query**: 8-15 giây (tùy GPU)

---

## 🎯 Advanced Features

### 1. Multi-PDF Support
```python
# Xử lý nhiều PDF cùng lúc
pdfs = ["doc1.pdf", "doc2.pdf"]
for pdf in pdfs:
    processor = PDFProcessor(pdf)
    chunks.extend(processor.chunk_text())
```

### 2. Save Chat History
```python
import json
# Lưu conversation
with open('history.json', 'w') as f:
    json.dump(chat_results, f)
```

### 3. Deploy as API
```bash
pip install fastapi uvicorn
# Tạo API endpoint
```

---

## 📚 Architecture Diagram

```
PDF Input
    ↓
[pdf_processor.py]
    ├─ Extract text
    └─ Create chunks
         ↓
[vector_store.py]
    ├─ Encode chunks
    ├─ Build FAISS index
    └─ Cache embeddings
         ↓
User Query
    ↓
[Retriever]
    ├─ Encode query
    ├─ Search similar chunks
    └─ Get top-5 context
         ↓
[qwen_model.py]
    ├─ Load model
    ├─ Generate response
    └─ Extract answer
         ↓
Output: Answer + Sources
```

---

## 📞 Need Help?

1. Check [../HUONG_DAN_CHI_TIET.md](../HUONG_DAN_CHI_TIET.md) for detailed guide
2. Check console error messages
3. Verify all paths in code
4. Ensure Python 3.10+ and all packages installed

---

**Made with ❤️ for PDF Question Answering**
