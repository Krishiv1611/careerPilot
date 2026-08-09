# ==========================================
# Stage 1: Builder
# ==========================================
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ==========================================
# Stage 2: Final Runtime
# ==========================================
FROM python:3.12-slim

WORKDIR /app

# Install runtime system dependencies only
RUN apt-get update && apt-get install -y \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Ensure scripts are in PATH
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Apply versioned schema changes before accepting traffic.
CMD ["sh", "-c", "alembic -c alembic.ini upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"]
