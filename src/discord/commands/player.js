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
        { name: 'Stop', value: 'stop' },
        { name: 'List', value: 'list' }
      ]
    }
  ]
};

// Command execution
export async function execute(interaction, env) {
  const action = interaction.data?.options?.[0]?.value;
  
  if (!action) {
    return {
      type: 4,
      data: {
        content: 'Invalid action',
        flags: 64
      }
    };
  }

  // Check if user is in a voice channel
  if (interaction?.channel?.type !== 2) {
    return {
      type: 4,
      data: {
        content: 'You need to be in a voice channel first!',
        flags: 64
      }
    };
  }

  const bucket = env.AUDIO_BUCKET;
  if (!bucket) {
    return {
      type: 4,
      data: {
        content: 'Audio storage not configured',
        flags: 64
      }
    };
  }

  try {
    // Store user's session information in KV
    const userId = interaction.member.user.id;
    const sessionKey = `player:${userId}`;
    const trackKey = 'soiree-relaxante-a-la-maison-nhac-jazz-thu-gian.mp3';
    
    // Get R2 object URL
    const audioUrl = await bucket.createSignedUrl(`${trackKey}`, 3600); // 1 hour expiration
    
    let audioFiles;
    let pauseState;
    let playerState;
    
    switch (action) {
      case 'play':
        // Save player state in KV
        playerState = {
          userId,
          channelId: interaction.channel_id,
          trackKey,
          status: 'playing',
          startTime: Date.now()
        };
        
        await env.POMODORO_STORAGE.put(sessionKey, JSON.stringify(playerState));
        
        return {
          type: 4,
          data: {
            content: `▶️ Now playing: ${trackKey}`,
            embeds: [
              {
                title: 'Now Playing',
                description: `Track: ${trackKey}`,
                color: 0x00ff00,
                fields: [
                  {
                    name: 'Stream URL',
                    value: `[Listen here](${audioUrl})`,
                    inline: true
                  }
                ]
              }
            ]
          }
        };
      
      case 'pause':
        pauseState = await env.POMODORO_STORAGE.get(sessionKey, 'json');
        
        if (!pauseState) {
          return {
            type: 4,
            data: {
              content: 'No active session to pause',
              flags: 64
            }
          };
        }
        
        pauseState.status = 'paused';
        await env.POMODORO_STORAGE.put(sessionKey, JSON.stringify(pauseState));
        
        return {
          type: 4,
          data: {
            content: '⏸️ Playback paused'
          }
        };
      
      case 'stop':
        await env.POMODORO_STORAGE.delete(sessionKey);
        
        return {
          type: 4,
          data: {
            content: '⏹️ Playback stopped'
          }
        };
      
      case 'list':
        audioFiles = await bucket.list();
        
        return {
          type: 4,
          data: {
            content: `Available tracks: ${audioFiles.objects.map(obj => obj.key).join(', ')}`
          }
        };
      
      default:
        return {
          type: 4,
          data: {
            content: 'Unknown action',
            flags: 64
          }
        };
    }
  } catch (error) {
    console.error('Player error:', error);
    return {
      type: 4,
      data: {
        content: `Error: ${error.message}`,
        flags: 64
      }
    };
  }
} 