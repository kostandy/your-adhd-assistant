#!/bin/bash
set -e

# Oracle Cloud setup script for Discord bot
echo "===== Setting up Oracle Cloud instance for Discord bot ====="

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -pm2@latest -g

# Create application directories
mkdir -p ~/discord-bot/{audio-cache,oci-keys}

# Install git if not present
sudo apt install -y git

echo "===== Installation complete! ====="
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "PM2 version: $(pm2 -v)"

echo "===== Next steps ====="
echo "1. Set up your environment variables in .env file"
echo "2. Clone the repository and install dependencies"
echo "3. Start the bot using PM2: pm2 start src/index.js --name discord-bot"

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 8080/tcp
sudo ufw enable

# Create a systemd service file for the bot
echo "Creating systemd service..."
cat > /tmp/discord-bot.service << EOL
[Unit]
Description=ADHD Discord Bot
After=docker.service
Requires=docker.service

[Service]
User=$USER
WorkingDirectory=/home/$USER/discord-bot
ExecStartPre=/usr/bin/mkdir -p /home/$USER/discord-bot/audio-cache
ExecStart=/usr/bin/docker run --rm --name adhd-discord-bot \
  -p 8080:8080 \
  -v /home/$USER/discord-bot/audio-cache:/app/audio-cache \
  --env-file .env \
  adhd-discord-bot:latest
ExecStop=/usr/bin/docker stop adhd-discord-bot
Restart=always

[Install]
WantedBy=multi-user.target
EOL

# Move service file to correct location
sudo mv /tmp/discord-bot.service /etc/systemd/system/

echo "===== Setup completed! ====="
echo ""
echo "Next steps:"
echo "1. Deploy your Docker image: './deploy-to-oracle.sh'"
echo "2. Create a .env file in ~/discord-bot/ with your environment variables"
echo "3. Start the service: 'sudo systemctl enable discord-bot && sudo systemctl start discord-bot'"
echo "4. Check status: 'sudo systemctl status discord-bot'"
echo ""
echo "To view logs: 'sudo journalctl -u discord-bot -f'" 