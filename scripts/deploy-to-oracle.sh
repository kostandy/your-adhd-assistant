#!/bin/bash
set -e

# Create required directories
mkdir -p ~/discord-bot/{audio-cache,oci-keys}

# Create private key file from environment variable
echo "${OCI_PRIVATE_KEY}" > ~/discord-bot/oci-keys/private.pem
chmod 600 ~/discord-bot/oci-keys/private.pem

# Clone/pull latest code
if [ -d "~/discord-bot/app" ]; then
  cd ~/discord-bot/app
  git pull
else
  git clone https://github.com/dmand/adhd-discord-bot.git ~/discord-bot/app
  cd ~/discord-bot/app
fi

# Install dependencies
npm ci

# Create .env file
cat > .env << EOL
DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
DISCORD_CLIENT_SECRET=${DISCORD_CLIENT_SECRET}
DISCORD_PUBLIC_KEY=${DISCORD_PUBLIC_KEY}
OCID=${OCID}
OCI_TENANCY=${OCI_TENANCY}
OCI_USER_ID=${OCI_USER_ID}
OCI_REGION=${OCI_REGION}
OCI_NAMESPACE=${OCI_NAMESPACE}
OCI_BUCKET_NAME=${OCI_BUCKET_NAME}
OCI_FINGERPRINT=${OCI_FINGERPRINT}
OCI_PRIVATE_KEY=/app/oci-keys/private.pem
PORT=3000
EOL

# Restart the service
pm2 restart discord-bot || pm2 start src/index.js --name discord-bot

echo "===== Done! =====" 