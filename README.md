# ADHD Discord Bot

A Discord bot designed to help ADHD individuals with productivity tools, including Pomodoro timers and ambient music players.

## Features

- **Pomodoro Timer**: Start focused work sessions with breaks
- **Audio Player**: Stream ambient music in Discord voice channels
- **Productivity Reminders**: Get notifications to stay on task

## Tech Stack

- Node.js v22.x
- Express.js
- Discord.js with voice support
- Oracle Object Storage for audio files
- Oracle Container Registry for Docker images
- Hosted on Oracle Cloud Free Tier

## Deployment Instructions for Oracle Cloud Free Tier

### Prerequisites

1. A Discord bot application with token and public key
2. Oracle Cloud Free Tier account
3. GitHub repo connected to GitHub Actions

### Step 1: Set up Oracle Cloud Instance

1. Sign in to your Oracle Cloud account and create a new Compute Instance
2. Select **Oracle Linux 8** as the operating system
3. Choose the **VM.Standard.A1.Flex** shape (included in free tier)
4. Configure with 4 OCPUs and 24 GB memory (free tier limits)
5. Add a public SSH key for access
6. Create and launch the instance
7. Set up a Cloud Object Storage bucket for audio files

### Step 2: Connect to Your Instance

```bash
ssh -i /path/to/your/private_key opc@your_instance_ip
```

### Step 3: Set Up the Environment

Run the setup script to install dependencies:

```bash
# Log into the VM and setup Docker
sudo yum update -y
sudo yum install -y docker-engine
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

Log out and log back in to apply group changes, then create the audio cache directory:

```bash
mkdir -p ~/discord-bot/audio-cache
```

### Step 4: Set up GitHub Actions Secrets

Add the following secrets to your GitHub repository:

- `DISCORD_CLIENT_ID` - Your Discord application ID
- `DISCORD_CLIENT_SECRET` - Your Discord client secret
- `DISCORD_PUBLIC_KEY` - Your Discord public key
- `OCI_REGION` - Your Oracle Cloud region (e.g., `eu-amsterdam-1`)
- `OCI_NAMESPACE` - Your Oracle Cloud tenancy namespace
- `OCI_USERNAME` - Your Oracle Cloud username
- `OCI_AUTH_TOKEN` - Auth token for Oracle Cloud Registry
- `OCI_IMAGE_NAME` - Name for the Docker image (e.g., `adhd-discord-bot`)
- `OCI_IMAGE_TAG` - Tag for the Docker image (e.g., `latest`)
- `OCI_BUCKET_NAME` - Name of your Oracle Object Storage bucket
- `ORACLE_VM_HOST` - IP address of your Oracle VM
- `ORACLE_VM_USER` - Username for SSH access to Oracle VM (usually `opc`)
- `ORACLE_VM_SSH_KEY` - Private SSH key for accessing the Oracle VM

### Step 5: Automated Deployment

Push your changes to the main branch. GitHub Actions will:

1. Build and test the code
2. Build the Docker image
3. Push the image to Oracle Container Registry
4. Deploy to your Oracle VM

The workflow can be found in `.github/workflows/main.yml`.

### Step 6: Manual Deployment (if needed)

If you need to deploy manually:

```bash
# Log into Oracle Container Registry
docker login <your-region>.ocir.io -u <namespace>/oracleidentitycloudservice/<username>

# Pull the latest image
docker pull <your-region>.ocir.io/<namespace>/<image-name>:<tag>

# Run the container
docker run -d --name adhd-discord-bot \
  --restart unless-stopped \
  -p 3000:3000 \
  -v ~/discord-bot/audio-cache:/app/audio-cache \
  -e DISCORD_CLIENT_ID=your_client_id \
  -e DISCORD_CLIENT_SECRET=your_client_secret \
  -e DISCORD_PUBLIC_KEY=your_public_key \
  -e PORT=3000 \
  -e OCI_REGION=your_region \
  -e OCI_NAMESPACE=your_namespace \
  -e OCI_BUCKET_NAME=your_bucket_name \
  <your-region>.ocir.io/<namespace>/<image-name>:<tag>
```

## Monitoring and Maintenance

- Check Docker container status with `docker ps`
- View logs with `docker logs adhd-discord-bot`
- Check disk usage with `df -h` to ensure you have space for audio caching
- Update by pushing changes to GitHub (CI/CD) or running `docker pull` followed by container restart

## Discord Bot Commands

- `/pomodoro start` - Start a Pomodoro timer
- `/pomodoro stop` - Stop current Pomodoro timer
- `/player play` - Play ambient music in your voice channel
- `/player pause` - Pause current playback
- `/player stop` - Stop and disconnect
- `/player list` - Show available audio tracks
- `/help` - Show all available commands

## License

MIT License
