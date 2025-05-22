#!/bin/sh

# Wait for ngrok to start and expose the URL
echo "Waiting for ngrok..."

# Wait for ngrok API to become available
NGROK_API="http://ngrok:4040/api/tunnels"
RETRIES=20

NGROK_URL=""

while [ $RETRIES -gt 0 ]; do
  # Try to fetch and parse the Ngrok public URL
  OUT="$(curl --silent --fail "$NGROK_API" || true)"
  if [ -n "$OUT" ]; then
    NGROK_URL=$(echo "$OUT" | grep -oE 'https://[a-z0-9.-]+\.ngrok(-free)?\.app' | head -n 1)
    if [ -n "$NGROK_URL" ]; then
      break  # Success!
    fi
  fi

  echo "Ngrok not ready yet... retries left: $RETRIES"
  RETRIES=$((RETRIES - 1))
  sleep 1
done

if [ -z "$NGROK_URL" ]; then
  echo "Failed to get Ngrok public URL."
  exit 1
fi

echo "Ngrok URL found: $NGROK_URL"

# Export it so Node.js can read it
export NGROK_URL

# Launch your backend
echo "Starting backend..."
exec node server.js