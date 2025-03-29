import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import express from 'express';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { ObjectStorageClient } from 'oci-objectstorage';
import { 
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  getVoiceConnection,
  NoSubscriberBehavior
} from '@discordjs/voice';
import { pomodoroCommand, execute as executePomodoro } from './discord/commands/pomodoro.js';
import { playerCommand } from './discord/commands/player.js';
import { helpCommand, execute as executeHelp } from './discord/commands/help.js';

// Load environment variables
dotenv.config();

// Get directory paths using ESM approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Oracle Object Storage client
const objectStorage = new ObjectStorageClient({
  authenticationDetailsProvider: {
    tenancyId: process.env.OCI_TENANCY,
    userId: process.env.OCI_USER_ID,
    fingerprint: process.env.OCI_FINGERPRINT,
    privateKey: process.env.OCI_PRIVATE_KEY,
    region: process.env.OCI_REGION
  }
});

const BUCKET_NAME = process.env.OCI_BUCKET_NAME || 'audio-assets';
const NAMESPACE = process.env.OCI_NAMESPACE;

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// Map to store active voice connections and players
const voiceConnections = new Map();

// Local cache directory for audio files
const CACHE_DIR = join(__dirname, '..', 'audio-cache');
// Create cache directory if it doesn't exist
try {
  await fs.mkdir(CACHE_DIR, { recursive: true });
} catch (err) {
  console.error('Failed to create cache directory:', err);
}

// Schedule cleanup of expired Pomodoro sessions (runs every minute)
cron.schedule('* * * * *', async () => {
  try {
    console.info('Running scheduled Pomodoro cleanup');
    
    // Get all active Pomodoro sessions
    const activeSessions = Array.from(client.guilds.cache.values())
      .flatMap(guild => Array.from(guild.channels.cache.values()))
      .filter(channel => channel.type === 'GUILD_VOICE')
      .map(channel => ({
        guildId: channel.guild.id,
        channelId: channel.id,
        members: channel.members
      }));

    // Check each session
    for (const session of activeSessions) {
      const connection = voiceConnections.get(session.guildId);
      if (connection?.player) {
        // If the bot is alone in the channel
        if (session.members.size === 1 && 
            session.members.first().id === client.user.id) {
          console.info(`Cleaning up inactive session in ${session.guildId}`);
          connection.player.stop();
          connection.connection.destroy();
          voiceConnections.delete(session.guildId);
        }
      }
    }
  } catch (error) {
    console.error('Error in scheduled cleanup:', error);
  }
});

// Initialize commands collection
const commands = new Map();

// Register commands
commands.set('pomodoro', {
  data: pomodoroCommand,
  execute: executePomodoro
});

commands.set('player', {
  data: playerCommand,
  execute: async (interaction) => {
    const action = interaction.options.getString('action');
    
    if (!action) {
      return await interaction.reply({
        content: 'Invalid action',
        ephemeral: true
      });
    }

    // Get voice channel
    const member = interaction.member;
    if (!member?.voice?.channel) {
      return await interaction.reply({
        content: 'You need to be in a voice channel first!',
        ephemeral: true
      });
    }

    const voiceChannel = member.voice.channel;
    const guildId = interaction.guildId;

    try {
      switch (action) {
        case 'play': {
          // Get or create voice connection
          let connection = getVoiceConnection(guildId);
          
          if (!connection) {
            connection = joinVoiceChannel({
              channelId: voiceChannel.id,
              guildId: guildId,
              adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            connection.on(VoiceConnectionStatus.Disconnected, async () => {
              try {
                await Promise.race([
                  new Promise(resolve => setTimeout(resolve, 5000)),
                  new Promise((resolve, reject) => {
                    connection.once(VoiceConnectionStatus.Ready, resolve);
                    connection.once(VoiceConnectionStatus.Failed, reject);
                  })
                ]);
              } catch (error) {
                console.error('Error in voice connection:', error);
                connection.destroy();
                voiceConnections.delete(guildId);
              }
            });
          }

          // Create audio player with options
          const player = createAudioPlayer({
            behaviors: {
              noSubscriber: NoSubscriberBehavior.Play
            }
          });

          // Get audio file
          const trackKey = 'soiree-relaxante-a-la-maison-nhac-jazz-thu-gian.mp3';
          const localFilePath = join(CACHE_DIR, trackKey);
          
          // Check if file is already cached
          let resource;
          try {
            await fs.access(localFilePath);
            console.info(`Using cached audio file: ${localFilePath}`);
            resource = createAudioResource(createReadStream(localFilePath));
          } catch {
            // If not in cache, fetch from Oracle Object Storage
            console.info(`Fetching audio file from Oracle Object Storage: ${trackKey}`);
            try {
              const getObjectRequest = {
                namespaceName: NAMESPACE,
                bucketName: BUCKET_NAME,
                objectName: trackKey
              };
              
              const response = await objectStorage.getObject(getObjectRequest);
              
              // Save to cache
              const buffer = await response.value.buffer();
              await fs.writeFile(localFilePath, buffer);
              
              // Create resource from cached file
              resource = createAudioResource(createReadStream(localFilePath));
            } catch (error) {
              console.error('Error fetching audio file:', error);
              return await interaction.reply({
                content: 'Failed to fetch audio file',
                ephemeral: true
              });
            }
          }
          
          // Play audio
          player.play(resource);
          connection.subscribe(player);
          
          // Store connection and player
          voiceConnections.set(guildId, { connection, player });
          
          // Handle player state changes
          player.on(AudioPlayerStatus.Playing, () => {
            console.info(`Now playing: ${trackKey} in ${voiceChannel.name}`);
          });
          
          player.on(AudioPlayerStatus.Idle, () => {
            console.info('Playback finished');
          });
          
          player.on('error', error => {
            console.error('Audio player error:', error);
          });
          
          return await interaction.reply({
            content: `▶️ Now playing: ${trackKey} in ${voiceChannel.name}`
          });
        }
        
        case 'pause': {
          const connection = voiceConnections.get(guildId);
          if (!connection?.player) {
            return await interaction.reply({
              content: 'No active playback in this voice channel',
              ephemeral: true
            });
          }
          
          connection.player.pause();
          return await interaction.reply({
            content: '⏸️ Playback paused'
          });
        }
        
        case 'stop': {
          const connection = voiceConnections.get(guildId);
          if (connection) {
            if (connection.player) {
              connection.player.stop();
            }
            connection.connection.destroy();
            voiceConnections.delete(guildId);
          }
          
          return await interaction.reply({
            content: '⏹️ Playback stopped'
          });
        }
        
        case 'list': {
          try {
            const files = await fs.readdir(CACHE_DIR);
            const audioFiles = files.filter(file => file.endsWith('.mp3'));
            
            if (audioFiles.length === 0) {
              return await interaction.reply({
                content: 'No audio tracks found',
                ephemeral: true
              });
            }
            
            return await interaction.reply({
              content: `Available tracks: ${audioFiles.join(', ')}`
            });
          } catch (err) {
            console.error('Error listing files:', err);
            return await interaction.reply({
              content: `Error listing tracks: ${err.message}`,
              ephemeral: true
            });
          }
        }
      }
    } catch (error) {
      console.error('Player error:', error);
      return await interaction.reply({
        content: `Error: ${error.message}`,
        ephemeral: true
      });
    }
  }
});

commands.set('help', {
  data: helpCommand,
  execute: executeHelp
});

// Discord client events
client.once('ready', () => {
  console.info(`Discord bot is ready! Logged in as ${client.user.tag}`);
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('Command execution error:', error);
    const errorMessage = {
      content: 'There was an error executing this command!',
      ephemeral: true
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Handle voice state updates (for cleanup)
client.on('voiceStateUpdate', (oldState, newState) => {
  // If the bot was disconnected from a voice channel
  if (oldState.member.id === client.user.id && oldState.channelId && !newState.channelId) {
    const guildId = oldState.guild.id;
    const connection = voiceConnections.get(guildId);
    
    if (connection) {
      console.info(`Bot disconnected from voice in ${oldState.guild.name}, cleaning up resources`);
      connection.player?.stop();
      voiceConnections.delete(guildId);
    }
  }
  
  // If the bot is alone in a voice channel, disconnect after 5 minutes
  if (oldState.channelId && 
      oldState.channel.members.size === 1 && 
      oldState.channel.members.first().id === client.user.id) {
    
    console.info(`Bot is alone in voice channel ${oldState.channel.name}, scheduling disconnect`);
    
    setTimeout(() => {
      // Check again after timeout to see if still alone
      const channel = client.channels.cache.get(oldState.channelId);
      if (channel && 
          channel.members.size === 1 && 
          channel.members.first().id === client.user.id) {
        
        console.info(`Disconnecting bot from empty voice channel ${channel.name}`);
        const connection = getVoiceConnection(oldState.guild.id);
        if (connection) {
          connection.destroy();
          voiceConnections.delete(oldState.guild.id);
        }
      }
    }, 2 * 60 * 1000); // 2 minutes
  }
});

// Express middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.send('OK');
});

// Assets endpoint
app.get('/assets/:filename', async (req, res) => {
  const filename = req.params.filename;
  if (!filename) {
    return res.status(400).send('Missing filename');
  }

  try {
    const localFilePath = join(CACHE_DIR, filename);
    
    try {
      // Try to serve from cache first
      await fs.access(localFilePath);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.sendFile(localFilePath);
    } catch {
      // If not in cache, fetch from Oracle Object Storage
      const getObjectRequest = {
        namespaceName: NAMESPACE,
        bucketName: BUCKET_NAME,
        objectName: filename
      };

      const response = await objectStorage.getObject(getObjectRequest);
      
      if (!response.value) {
        return res.status(404).send('File not found');
      }

      // Cache the file
      await fs.writeFile(localFilePath, Buffer.from(await response.value.arrayBuffer()));

      // Set response headers
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Content-Type', 'audio/mpeg');
      
      return res.sendFile(localFilePath);
    }
  } catch (error) {
    console.error('Error accessing file:', error);
    return res.status(500).send('Error accessing file');
  }
});

// Start Express server
app.listen(port, () => {
  console.info(`Server listening on port ${port}`);
});

// Login to Discord
client.login(process.env.DISCORD_CLIENT_SECRET); 