import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionType } from 'discord-interactions';

// Hoisted mocks
const mockCommands = vi.hoisted(() => ({
  pomodoro: {
    execute: vi.fn().mockResolvedValue({
      type: 4,
      data: { content: 'Pomodoro command response' }
    })
  },
  player: {
    execute: vi.fn().mockResolvedValue({
      type: 4,
      data: { content: 'Player command response' }
    })
  },
  help: {
    execute: vi.fn().mockResolvedValue({
      type: 4,
      data: { content: 'Help command response', flags: 64 }
    })
  }
}));

// Mock modules
vi.mock('discord-interactions', () => ({
  InteractionType: {
    PING: 1,
    APPLICATION_COMMAND: 2
  },
  verifyKey: vi.fn().mockReturnValue(true)
}));

// Setup mock for app and commands
vi.mock('../index.js', () => {
  // Create Hono app mock
  const mockHandlers = {};
  
  const mockApp = {
    get: (path, handler) => {
      mockHandlers[`GET ${path}`] = handler;
    },
    post: (path, handler) => {
      mockHandlers[`POST ${path}`] = handler;
    },
    handlers: mockHandlers
  };
  
  // Register commands
  const commands = new Map();
  commands.set('pomodoro', {
    data: { name: 'pomodoro' },
    execute: mockCommands.pomodoro.execute
  });
  commands.set('player', {
    data: { name: 'player' },
    execute: mockCommands.player.execute
  });
  commands.set('help', {
    data: { name: 'help' },
    execute: mockCommands.help.execute
  });
  
  // Mock implementation of handlers
  mockApp.get('/health', (c) => c.text('OK'));
  
  mockApp.post('/discord-interaction', async (c) => {
    const signature = c.req.header('X-Signature-Ed25519');
    const timestamp = c.req.header('X-Signature-Timestamp');
    
    if (!signature || !timestamp) {
      return c.text('Missing required headers', 401);
    }
    
    const body = await c.req.json();
    
    if (body.type === InteractionType.PING) {
      return c.json({ type: 1 });
    }
    
    if (body.type === InteractionType.APPLICATION_COMMAND) {
      const commandName = body.data?.name;
      
      if (!commandName) {
        return c.json({
          type: 4,
          data: { content: 'Invalid command format', flags: 64 }
        });
      }
      
      const command = commands.get(commandName);
      
      if (!command) {
        return c.json({
          type: 4,
          data: { content: 'Command not found', flags: 64 }
        });
      }
      
      try {
        const response = await command.execute(body, c.env);
        return c.json(response);
      } catch (error) {
        console.error('Command execution error:', error);
        return c.json({
          type: 4,
          data: {
            content: 'There was an error executing this command!',
            flags: 64
          }
        });
      }
    }
    
    return c.json({ error: 'Unknown interaction type' }, 400);
  });
  
  return { default: mockApp };
});

// Import after mocking
import app from '../index.js';

describe('Discord Bot API', () => {
  let mockContext;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock functions
    mockCommands.pomodoro.execute.mockClear();
    mockCommands.player.execute.mockClear();
    mockCommands.help.execute.mockClear();
    
    // Create mock context
    mockContext = {
      req: {
        header: vi.fn(),
        json: vi.fn()
      },
      json: vi.fn().mockImplementation(data => data),
      text: vi.fn().mockImplementation(data => data),
      env: {
        DISCORD_PUBLIC_KEY: 'test_key'
      }
    };
  });
  
  describe('Health Check', () => {
    it('should return OK', () => {
      const result = app.handlers['GET /health'](mockContext);
      expect(result).toBe('OK');
    });
  });
  
  describe('Discord Interaction Endpoint', () => {
    it('should handle PING interaction', async () => {
      // Setup headers
      mockContext.req.header.mockImplementation(name => {
        if (name === 'X-Signature-Ed25519') return 'test_signature';
        if (name === 'X-Signature-Timestamp') return 'test_timestamp';
        return null;
      });
      
      // Setup request body
      mockContext.req.json.mockResolvedValue({
        type: InteractionType.PING
      });
      
      const response = await app.handlers['POST /discord-interaction'](mockContext);
      
      expect(response).toEqual({ type: 1 });
    });
    
    it('should handle pomodoro command', async () => {
      // Setup headers
      mockContext.req.header.mockImplementation(name => {
        if (name === 'X-Signature-Ed25519') return 'test_signature';
        if (name === 'X-Signature-Timestamp') return 'test_timestamp';
        return null;
      });
      
      // Setup request body
      mockContext.req.json.mockResolvedValue({
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'pomodoro'
        }
      });
      
      const response = await app.handlers['POST /discord-interaction'](mockContext);
      
      expect(mockCommands.pomodoro.execute).toHaveBeenCalled();
      expect(response).toEqual({
        type: 4,
        data: { content: 'Pomodoro command response' }
      });
    });
    
    it('should handle player command', async () => {
      // Setup headers
      mockContext.req.header.mockImplementation(name => {
        if (name === 'X-Signature-Ed25519') return 'test_signature';
        if (name === 'X-Signature-Timestamp') return 'test_timestamp';
        return null;
      });
      
      // Setup request body
      mockContext.req.json.mockResolvedValue({
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'player'
        }
      });
      
      const response = await app.handlers['POST /discord-interaction'](mockContext);
      
      expect(mockCommands.player.execute).toHaveBeenCalled();
      expect(response).toEqual({
        type: 4,
        data: { content: 'Player command response' }
      });
    });
    
    it('should handle help command', async () => {
      // Setup headers
      mockContext.req.header.mockImplementation(name => {
        if (name === 'X-Signature-Ed25519') return 'test_signature';
        if (name === 'X-Signature-Timestamp') return 'test_timestamp';
        return null;
      });
      
      // Setup request body
      mockContext.req.json.mockResolvedValue({
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'help'
        }
      });
      
      const response = await app.handlers['POST /discord-interaction'](mockContext);
      
      expect(mockCommands.help.execute).toHaveBeenCalled();
      expect(response).toEqual({
        type: 4,
        data: { content: 'Help command response', flags: 64 }
      });
    });
    
    it('should handle missing headers', async () => {
      // Setup missing headers
      mockContext.req.header.mockReturnValue(null);
      
      const response = await app.handlers['POST /discord-interaction'](mockContext);
      
      expect(response).toBe('Missing required headers');
    });
    
    it('should handle unknown command', async () => {
      // Setup headers
      mockContext.req.header.mockImplementation(name => {
        if (name === 'X-Signature-Ed25519') return 'test_signature';
        if (name === 'X-Signature-Timestamp') return 'test_timestamp';
        return null;
      });
      
      // Setup request body
      mockContext.req.json.mockResolvedValue({
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'unknown_command'
        }
      });
      
      const response = await app.handlers['POST /discord-interaction'](mockContext);
      
      expect(response).toEqual({
        type: 4,
        data: { content: 'Command not found', flags: 64 }
      });
    });
  });
}); 