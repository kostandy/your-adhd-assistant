import { Hono } from 'hono';
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions';
import { pomodoroCommand, execute as executePomodoro } from './commands/pomodoro.js';
import { playerCommand, execute as executePlayer } from './commands/player.js';
import { helpCommand, execute as executeHelp } from './commands/help.js';

const app = new Hono();

// Initialize commands collection
const commands = new Map();

// Register commands
commands.set('pomodoro', {
  data: pomodoroCommand,
  execute: executePomodoro
});

commands.set('player', {
  data: playerCommand,
  execute: executePlayer
});

commands.set('help', {
  data: helpCommand,
  execute: executeHelp
});

// Health check endpoint
app.get('/health', (c) => c.text('OK'));

// Discord interaction endpoint
app.post('/interactions', async (c) => {
  try {
    const signature = c.req.header('X-Signature-Ed25519');
    const timestamp = c.req.header('X-Signature-Timestamp');
    const body = await c.req.json();

    if (!signature || !timestamp) {
      return c.text('Missing required headers', 401);
    }

    // Verify the interaction
    const isValid = await verifyKey(
      c.req.raw.body,
      signature,
      timestamp,
      c.env.DISCORD_PUBLIC_KEY
    );

    console.debug('req.raw.body', c.req.raw.body.toString());
    console.debug('stringified req.raw', c.req.raw.body.toString());

    console.info('Verification result:', isValid);

    if (!isValid) {
      return c.text('Invalid request signature', 401);
    }

    console.info('Interaction verified:', isValid);

    // Handle the interaction
    const interaction = body;

    console.info('Interaction:', interaction);

    if (interaction.type === InteractionType.PING) {
      return c.res.json({ type: InteractionResponseType.PONG }); // PONG for ping
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const commandName = interaction.data?.name;
      if (typeof commandName !== 'string') {
        return c.res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Invalid command format', flags: 64 }
        });
      }

      const command = commands.get(commandName);
      if (!command) {
        return c.res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Command not found', flags: 64 }
        });
      }

      try {
        const response = await command.execute(body, c.env);
        return c.res.json(response);
      } catch (error) {
        console.error('Command execution error:', error instanceof Error ? error.message : String(error));
        return c.res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'There was an error executing this command!',
            flags: 64
          }
        });
      }
    }

    return c.res.json({ error: 'Unknown interaction type' }, 400);
  } catch (error) {
    console.error('Request handling error:', error instanceof Error ? error.message : String(error));
    return c.res.text('Internal Server Error', 500);
  }
});

// Export scheduled function for Cloudflare Workers cron triggers
export async function scheduled(event, env, ctx) {
  console.info('Running scheduled task:', event.cron);
  
  // Use waitUntil to ensure all async operations complete
  ctx.waitUntil(processExpiredSessions(env));
}

async function processExpiredSessions(env) {
  try {
    // Check and update any expired Pomodoro sessions
    const kvNamespace = env.POMODORO_STORAGE;
    if (!kvNamespace) {
      console.error('POMODORO_STORAGE KV namespace not available');
      return;
    }

    // List all keys with prefix 'pomodoro:'
    const keys = await kvNamespace.list({ prefix: 'pomodoro:' });
    
    for (const key of keys.keys) {
      try {
        const session = await kvNamespace.get(key.name, 'json');
        
        if (!session) continue;
        
        const now = Date.now();
        
        // If the session has expired, update status
        if (session.endTime && session.endTime < now && session.status === 'active') {
          session.status = 'completed';
          await kvNamespace.put(key.name, JSON.stringify(session));
          console.info(`Updated expired session: ${key.name}`);
        }
      } catch (err) {
        console.error(`Error processing session ${key.name}:`, err);
      }
    }
    
    console.info('Scheduled task completed successfully');
  } catch (error) {
    console.error('Error in scheduled function:', error);
  }
}

export default {
  fetch: app.fetch,
  scheduled
}; 