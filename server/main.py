from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import httpx
import json
from typing import List, Optional
from pydantic import BaseModel

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_API_URL = "http://localhost:11434/api/chat"

class Message(BaseModel):
    role: str
    content: str
    timestamp: Optional[int] = None

class ChatRequest(BaseModel):
    messages: List[Message]
    system_prompt: str

async def stream_chat_response(messages: List[Message], system_prompt: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                OLLAMA_API_URL,
                json={
                    "model": "mistral",  # 使用 Mistral 模型
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        *[{"role": m.role, "content": m.content} for m in messages]
                    ],
                    "stream": True,
                },
                timeout=None,
            )
            
            async for line in response.aiter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        if "error" in data:
                            yield f"data: {json.dumps({'error': data['error']})}\n\n"
                            break
                        
                        response_data = {
                            "id": "chat_" + str(data.get("created", 0)),
                            "choices": [{
                                "delta": {
                                    "content": data.get("message", {}).get("content", ""),
                                    "role": "assistant"
                                },
                                "finish_reason": data.get("done") and "stop" or None
                            }],
                            "created": data.get("created", 0),
                            "model": "mistral",
                            "object": "chat.completion.chunk"
                        }
                        yield f"data: {json.dumps(response_data)}\n\n"
                        
                        if data.get("done"):
                            yield "data: [DONE]\n\n"
                            break
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

@app.post("/api/chat")
async def chat(request: ChatRequest):
    return StreamingResponse(
        stream_chat_response(request.messages, request.system_prompt),
        media_type="text/event-stream"
    ) 