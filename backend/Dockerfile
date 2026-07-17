FROM python:3.10-slim

WORKDIR /app

# Install system dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies and make sure python-dotenv and openai are installed
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir python-dotenv openai

COPY . .

# FastAPI runs on 8000 by default in our configs
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
