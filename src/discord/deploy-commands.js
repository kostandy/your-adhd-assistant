import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import dotenv from 'dotenv';

const config = dotenv.config();

const commands = [
  {
    name: 'pomodoro',
    description: 'Start a Pomodoro timer',
    options: [
      {
        name: 'action',
        description: 'What action to perform',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'help', value: 'help' },
          { name: 'start', value: 'start' },
          { name: 'stop', value: 'stop' },
          { name: 'join', value: 'join' }
        ]
      }
    ]
  },
  {
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
  },
  {
    name: 'help',
    description: 'Show all available commands and their descriptions'
  }
];

const rest = new REST().setToken(config.parsed.DISCORD_CLIENT_SECRET);

try {
  console.info('Started refreshing application (/) commands.');

  await rest.put(
    Routes.applicationCommands(config.parsed.DISCORD_CLIENT_ID),
    { body: commands },
  );

  console.info('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
} 