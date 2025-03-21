# AI Chat Backend Service

这是 AI Chat 工具的后端服务，基于 FastAPI 和 Ollama 实现。

## 环境要求

- Python 3.8+
- Ollama (需要在本地安装并运行)

## 安装步骤

1. 安装 Ollama

```bash
# macOS
curl https://ollama.ai/install.sh | sh

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

2. 下载 Mistral 模型

```bash
ollama pull mistral
```

3. 安装 Python 依赖

```bash
pip install -r requirements.txt
```

## 运行服务

```bash
uvicorn main:app --reload --port 8000
```

服务将在 http://localhost:8000 运行。

## API 文档

启动服务后，可以在 http://localhost:8000/docs 查看 API 文档。

## 环境变量

- `OLLAMA_API_URL`: Ollama API 地址，默认为 http://localhost:11434/api/chat

## 注意事项

- 确保 Ollama 服务在运行中
- 确保已经下载了 Mistral 模型
- 在生产环境中，请适当配置 CORS 策略
