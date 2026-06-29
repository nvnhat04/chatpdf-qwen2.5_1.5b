# 🚀 Hướng Dẫn Cài Đặt ChatPDF UI

**Giao diện web ChatGPT-like cho pipeline ChatPDF sử dụng mô hình Qwen2.5-1.5B + RAG**

---

## 📋 Yêu Cầu Hệ Thống

| Thành phần | Phiên bản tối thiểu |
|---|---|
| Node.js | 18.x trở lên |
| npm | 9.x trở lên |
| Python | 3.9+ |
| RAM | 8GB+ (16GB khuyến nghị) |
| GPU | NVIDIA GPU với CUDA (tùy chọn, tăng tốc) |

---

## 🗂️ Cấu Trúc Dự Án

```
chatbot_uet/
├── api_server.py          ← FastAPI server (v1 - PDF cố định)
├── api_server_v2.py       ← FastAPI server (v2 - Upload PDF ✅ dùng cái này)
├── pdf_processor.py       ← Xử lý & chunk PDF
├── qwen_model.py          ← Load & inference Qwen2.5-1.5B
├── vector_store.py        ← FAISS vector store + RAG retriever
├── config.ini             ← Cấu hình đường dẫn model
└── ui/                    ← Next.js Frontend
    ├── src/
    │   ├── app/           ← Pages & layouts
    │   ├── components/    ← UI components
    │   ├── services/      ← API service layer
    │   └── types/         ← TypeScript types
    ├── .env.local         ← Biến môi trường
    └── package.json
```

---

## ⚙️ BƯỚC 1 — Cài Đặt Backend (FastAPI)

### 1.1 Tạo môi trường ảo Python

```bash
cd D:\Github\LLM\chatbot_uet
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Linux/Mac
```

### 1.2 Cài đặt dependencies Python

```bash
pip install fastapi uvicorn python-multipart
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install transformers accelerate
pip install faiss-cpu sentence-transformers
pip install pypdf2 pdfplumber
pip install pydantic numpy
```

> **CPU only (không có GPU):** Thay lệnh torch bằng `pip install torch torchvision torchaudio`

### 1.3 Tải model Qwen2.5-1.5B (nếu chưa có)

```bash
pip install huggingface-hub

python -c "
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id='Qwen/Qwen2.5-1.5B-Instruct',
    local_dir='D:/Github/LLM/models/qwen2.5-1.5b'
)
"
```

---

## 🖥️ BƯỚC 2 — Khởi Động Backend Server

```bash
cd D:\Github\LLM\chatbot_uet
venv\Scripts\activate
python api_server_v2.py
```

**Kết quả mong đợi:**
```
🚀 PDF CHATBOT - FASTAPI SERVER v2.0 (With Upload)
📍 API available at: http://localhost:8000
✅ Default chatbot initialized successfully!
```

> ⚠️ **Lần đầu:** Model cần 2–5 phút để load vào bộ nhớ.

**Kiểm tra hoạt động:** Mở http://localhost:8000/health → `"status": "ready"`

---

## 🌐 BƯỚC 3 — Cài Đặt Frontend (Next.js)

### 3.1 Cài đặt Node.js 18+ từ https://nodejs.org/

### 3.2 Cài đặt và chạy

```bash
cd D:\Github\LLM\chatbot_uet\ui
npm install
npm run dev
```

**Mở trình duyệt tại:** http://localhost:3000

### 3.3 Cấu hình API URL (nếu cần)

Mở file `ui/.env.local` và chỉnh:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🔄 BƯỚC 4 — Cách Sử Dụng

1. Mở **http://localhost:3000**
2. Kiểm tra **status bar** ở góc dưới sidebar → `Sẵn sàng` (chấm xanh)
3. **Upload PDF** bằng cách kéo thả hoặc click vào vùng upload
4. Chờ xử lý PDF (5–30s tuỳ kích thước file)
5. Đặt câu hỏi trong ô chat → nhấn `Enter` hoặc nút gửi
6. Xem câu trả lời và **nguồn tham khảo** từ PDF

---

## ✨ Tính Năng UI

| Tính năng | Mô tả |
|---|---|
| 🎨 Dark mode | Giao diện tối hiện đại như ChatGPT |
| 📤 Drag & Drop | Kéo thả PDF trực tiếp vào sidebar |
| 📊 Progress ring | Tiến trình xử lý PDF dạng vòng tròn |
| 💬 Chat bubbles | Tin nhắn phân biệt user/AI rõ ràng |
| 📄 Nguồn tham khảo | Xem đoạn văn gốc được trích từ PDF |
| ❓ Câu hỏi gợi ý | Click để tự điền câu hỏi mẫu |
| 📱 Responsive | Hỗ trợ mobile với sidebar ẩn/hiện |
| ⏱️ Processing time | Thời gian xử lý mỗi câu trả lời |
| 🔄 Health check | Tự động kiểm tra trạng thái server 30s/lần |

---

## 🐛 Xử Lý Lỗi Thường Gặp

### "Mất kết nối" trong status bar
Backend chưa chạy → Chạy lại `python api_server_v2.py`

### "Only PDF files are allowed"
Chỉ upload file `.pdf`

### Model không load
Kiểm tra đường dẫn `D:\Github\LLM\models\qwen2.5-1.5b` có đúng không

### Out of Memory
Thêm vào `qwen_model.py` khi load model:
```python
torch_dtype=torch.float16,
low_cpu_mem_usage=True,
```

### CORS error
Đảm bảo `api_server_v2.py` đang chạy (đã có CORS `allow_origins=["*"]`)

---

## 🚀 Production Build

```bash
cd D:\Github\LLM\chatbot_uet\ui
npm run build
npm start
```

---

## 📡 API Endpoints Backend

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/health` | Trạng thái server |
| POST | `/upload` | Upload & xử lý PDF |
| POST | `/chat` | Gửi câu hỏi |
| GET | `/sessions/{id}` | Thông tin session |
| DELETE | `/sessions/{id}` | Xóa session |
| GET | `/docs` | Swagger UI |

---

## 💡 Tips Tối Ưu

- **GPU CUDA 12.1:** Giúp tăng tốc 5–10x so với CPU
- **Cache embeddings:** Tự động lưu tại `./embeddings/` — lần sau nhanh hơn
- **Temperature thấp (0.3):** Câu trả lời chính xác hơn, ít sáng tạo
- **Temperature cao (0.9):** Sáng tạo hơn, phù hợp tóm tắt

---

*Developed at UET (University of Engineering and Technology) · Powered by Qwen2.5-1.5B + RAG + Next.js*
