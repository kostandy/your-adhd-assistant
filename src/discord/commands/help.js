// Command definition
export const helpCommand = {
  name: 'help',
  description: 'Show all available commands and their descriptions'
};

// Command execution
export function execute() {
  return {
    type: 4,
    data: {
      content: `**Available Commands:**

\`/pomodoro\` - Start a Pomodoro timer
• \`start\` - Begin a new Pomodoro session
• \`stop\` - Stop the current timer
• \`join\` - Join an existing Pomodoro session
• \`help\` - Show Pomodoro technique guide

\`/player\` - Control music playback
• \`play\` - Play or resume music
• \`pause\` - Pause current playback
• \`stop\` - Stop playback

\`/help\` - Show this help message`,
      flags: 64 // ephemeral
    }
  };
} 