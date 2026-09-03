#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")"

echo "=========================================="
echo "🚀 Preparing Temporary Deployment"
echo "=========================================="
echo ""

echo "🔨 1. Building the application for production..."
rm -rf .next
npm run build

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Build failed! Please check the TypeScript errors above."
  exit 1
fi

echo ""
echo "✅ Build successful!"
echo "🚀 2. Starting the production server on port 3000..."

npm run start &
SERVER_PID=$!

echo "⏳ Waiting for server to boot up..."
sleep 5

echo ""
echo "🌐 3. Starting LocalTunnel to expose port 3000..."
npx localtunnel --port 3000 &
TUNNEL_PID=$!

# Cleanup function to kill background processes when script exits
function cleanup {
  echo ""
  echo "Shutting down the server and tunnel..."
  kill $SERVER_PID 2>/dev/null
  kill $TUNNEL_PID 2>/dev/null
  exit 0
}

# Trap exit signals to ensure cleanup runs
trap cleanup EXIT SIGINT SIGTERM

echo "=========================================="
echo "⚠️  NOTE: When you visit the URL, click 'Click to Continue' on the warning screen."
echo "🛑 Press Ctrl+C in this terminal to safely stop the server and tunnel."
echo "=========================================="

while true; do
  sleep 3600
done
