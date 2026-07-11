FROM python:3.11-slim

WORKDIR /app

# Install uv for fast dependency management
RUN pip install --no-cache-dir uv

# Copy dependency files first for layer caching
COPY pyproject.toml .

# Install dependencies
RUN uv venv --python 3.11 && uv pip install -e .

# Copy application code
COPY . .

# Create data directory for SQLite
RUN mkdir -p /data

EXPOSE 8787

CMD [".venv/bin/uvicorn", "sosofund.api:app", "--host", "0.0.0.0", "--port", "8787"]
