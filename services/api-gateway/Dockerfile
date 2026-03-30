FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libpq-dev gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8000
CMD python -c "import uvicorn; uvicorn.run('src.main:app', host='0.0.0.0', port=int(__import__('os').environ.get('PORT', 8000)))"
