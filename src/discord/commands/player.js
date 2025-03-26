// Command definition
export const playerCommand = {
  name: 'player',
  description: 'Control music playback',
  options: [
    {
      name: 'action',
      description: 'What action to perform',
      type: 3, // STRING
      required: true,
      choices: [
        { name: 'Play/Resume', value: 'play' },
        { name: 'Pause', value: 'pause' },
        { name: 'Stop', value: 'stop' }
      ]
    }
  ]
};

// Command execution
export function execute(interaction) {
  if (!interaction.data?.options?.[0]?.value) {
    return {
      type: 4,
      data: {
        content: 'Invalid action',
        flags: 64
      }
    };
  }

  if (!interaction.member?.voice?.channel) {
    return {
      type: 4,
      data: {
        content: 'You need to be in a voice channel first!',
        flags: 64
      }
    };
  }

  return {
    type: 4,
    data: {
      content: 'Voice features are currently unavailable in the serverless version.'
    }
  };
} 