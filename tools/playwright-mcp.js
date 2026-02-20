#!/usr/bin/env node

// MCP stdio server — implements the Model Context Protocol (2024-11-05).
// Exposes a single "ping" tool so the server can be extended incrementally.
//
// Protocol flow:
//   client → initialize           → server responds with capabilities
//   client → notifications/initialized  (notification, no response)
//   client → tools/list           → server lists available tools
//   client → tools/call { name }  → server executes tool and returns content

const readline = require('readline');

const PROTOCOL_VERSION = '2024-11-05';

const TOOLS = [
  {
    name: 'ping',
    description: 'Health-check tool. Returns "pong" to confirm the server is running.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

const rl = readline.createInterface({ input: process.stdin });

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

function reply(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function replyError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

function handleRequest(msg) {
  const { id, method, params } = msg;

  // Notifications have no id and must not receive a response.
  const isNotification = id === undefined || id === null;

  switch (method) {
    case 'initialize':
      reply(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: 'playwright-mcp', version: '0.1.0' },
      });
      break;

    case 'notifications/initialized':
      // Notification — no response required.
      break;

    case 'tools/list':
      reply(id, { tools: TOOLS });
      break;

    case 'tools/call': {
      const toolName = params?.name;
      if (toolName === 'ping') {
        reply(id, {
          content: [{ type: 'text', text: 'pong from playwright-mcp' }],
        });
      } else {
        replyError(id, -32602, `Unknown tool: ${toolName}`);
      }
      break;
    }

    default:
      if (!isNotification) {
        replyError(id, -32601, `Method not found: ${method}`);
      }
      break;
  }
}

rl.on('line', (line) => {
  line = line.trim();
  if (!line) return;

  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }

  if (msg.method) {
    handleRequest(msg);
  }
});
