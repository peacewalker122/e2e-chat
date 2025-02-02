# Use a minimal Python image
FROM python:3.11-slim

# Install uv package manager
RUN pip install uv

# Set the working directory in the container
WORKDIR /app

# Copy dependency file first (for caching)
COPY requirements.txt .

# Install dependencies using uv (faster than pip)
RUN uv pip install --system -r requirements.txt

# Copy the rest of the app
COPY . .

# Set the entry point for the container
CMD ["fastapi", "run", "main.py"]
