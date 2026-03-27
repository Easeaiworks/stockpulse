#!/bin/bash
# Build script for Railway / Render deployment
set -e

echo "=== Building StockPulse ==="

# Install frontend dependencies and build
echo "--- Building frontend ---"
cd frontend
npm install
npm run build
cd ..

# Install backend dependencies
echo "--- Installing backend dependencies ---"
cd backend
pip install -r requirements.txt
cd ..

echo "=== Build complete ==="
