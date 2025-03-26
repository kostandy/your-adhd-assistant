# ADHD Assistant Discord Bot

A Discord bot designed to help users with ADHD and productivity challenges by providing tools like Pomodoro timers, focus assistance, and more.

## Features

- **Pomodoro Timer**: Start a Pomodoro timer with customizable work and break durations
- **Voice Channel Timer**: Use timers with screen sharing in voice channels
- **Premium Features**: Configure timers, sounds, and other settings with a premium subscription

## Tech Stack

- **Frontend**: React 19, Next.js 15, TailwindCSS 4, shadcn/ui
- **Backend**: Node.js with Discord.js
- **Database**: (To be configured)
- **Payment Provider**: (To be configured)

## Getting Started

### Prerequisites

- Node.js LTS 22+
- Discord Bot Token and Client ID
- (Optional) Payment provider account

### Setup

1. Clone this repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your Discord bot token and other credentials:

   ```bash
   cp .env.example .env
   ```

4. Register bot commands:

   ```bash
   npm run bot:deploy
   ```

5. Start the bot:

   ```bash
   npm run bot:dev
   ```

6. Start the web interface (optional):

   ```bash
   npm run dev
   ```

## Commands

- `/pomodoro [work] [break]` - Start a Pomodoro timer with optional custom durations

## Development

- `npm run dev` - Start Next.js development server
- `npm run bot:dev` - Start the bot with hot reloading
- `npm run bot:deploy` - Register/update slash commands

## License

GPL-3.0 license
