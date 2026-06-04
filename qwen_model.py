from typing import Dict, List

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer


class QwenChatbot:
    """Tích hợp Qwen2.5-1.5b cho RAG"""
    
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🔧 Sử dụng device: {self.device}")
        
        try:
            print(f"📥 Tải tokenizer từ {model_path}...")
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            print("✓ Tokenizer loaded")
            
            print(f"📥 Tải model từ {model_path}...")
            print("⏳ Điều này có thể mất 30-60 giây...")
            
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path,
                device_map="auto",
                dtype=torch.float16 if self.device == "cuda" else torch.float32,
                trust_remote_code=True
            )
            print("✓ Model loaded successfully")
            
        except RuntimeError as e:
            print(f"\n❌ CUDA/GPU Error: {e}")
            print("💡 Solutions:")
            print("   - Check if you have enough GPU memory")
            print("   - Try using CPU: change device to 'cpu'")
            print("   - Reduce batch size or max_tokens")
            raise
            
        except Exception as e:
            print(f"\n❌ Model loading error: {e}")
            print(f"   Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            raise
        
    def generate_response(self, 
                         user_query: str, 
                         context: str,
                         max_tokens: int = 512,
                         temperature: float = 0.7) -> str:
        """Generate response sử dụng context từ PDF"""
        
        # System prompt
        system_prompt = """Bạn là một trợ lý thông minh chuyên trả lời câu hỏi về tài liệu PDF.
Hãy trả lời dựa trên thông tin được cung cấp trong phần Context.
Nếu thông tin không có trong Context, hãy nói "Tôi không tìm thấy thông tin này trong tài liệu."
Hãy trả lời một cách chi tiết và có cấu trúc."""
        
        # Xây dựng prompt
        prompt = f"""Context từ tài liệu:
{context}

Câu hỏi: {user_query}

Trả lời:"""
        
        # Tạo messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        # Apply chat template
        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        
        # Tokenize
        inputs = self.tokenizer(text, return_tensors="pt").to(self.device)
        
        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=0.9,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        # Decode
        response = self.tokenizer.decode(
            outputs[0],
            skip_special_tokens=True
        )
        
        # Trích xuất phần response (loại bỏ system + user message)
        # Tìm dòng "Trả lời:" và lấy phần sau
        try:
            answer_start = response.find("Trả lời:") + len("Trả lời:")
            answer = response[answer_start:].strip()
        except:
            answer = response
            
        return answer


if __name__ == "__main__":
    model_path = "D:\\Github\\LLM\\models\\qwen2.5-1.5b"
    
    chatbot = QwenChatbot(model_path)
    
    # Test
    test_context = "Transformer là một mô hình deep learning được giới thiệu năm 2017."
    test_query = "Transformer là gì?"
    
    response = chatbot.generate_response(test_query, test_context)
    print(f"\n❓ Câu hỏi: {test_query}")
    print(f"💬 Trả lời: {response}")
