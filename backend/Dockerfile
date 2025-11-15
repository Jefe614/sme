FROM python:3.11-slim

WORKDIR /app

# Install netcat to check DB readiness
RUN apt-get update && apt-get install -y netcat-traditional && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Make sure the script is executable
RUN chmod +x wait_for_db.sh

# Default command (optional — handled by docker-compose)
CMD ["sh", "wait_for_db.sh"]
