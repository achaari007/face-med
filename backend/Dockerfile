FROM python:3.10-slim

# --------------------------------------------------
# System dependencies required for OpenCV & dlib
# --------------------------------------------------
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# --------------------------------------------------
# Set workdir
# --------------------------------------------------
WORKDIR /app

# --------------------------------------------------
# Install Python dependencies
# --------------------------------------------------
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --------------------------------------------------
# Copy application code
# --------------------------------------------------
COPY . .

# --------------------------------------------------
# Run FastAPI app
# --------------------------------------------------
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
