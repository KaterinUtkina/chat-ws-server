const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, () => {
  console.log(`WebSocket server started on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

const clients = new Map();

const sendJson = (ws, obj) => {
  ws.send(JSON.stringify(obj));
}

const broadcast = (message, excludeClientId = null) => {
  const messageStr = JSON.stringify(message);
  for (const [clientId, client] of clients.entries()) {
    if (client.ws.readyState === WebSocket.OPEN && clientId !== excludeClientId) {
      client.ws.send(messageStr);
    }
  }
}

const broadcastClientCount = () => {
  const countMsg = {
    type: 'clients_count',
    content: clients.size,
    timestamp: Date.now(),
  };

  broadcast(countMsg);
};

wss.on('connection', (ws) => {
  console.log('Client connected');

  const clientId = uuidv4();
  clients.set(clientId, { ws });

  sendJson(ws, {
    type: 'client_id',
    content: clientId,
  });

  broadcastClientCount();
  broadcast({
    content: '',
    type: 'user_connect',
    timestamp: Date.now(),
    author: clientId,
  });

  ws.on('message', (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString());

      if (
        !message.content ||
        typeof message.author !== 'string' ||
        typeof message.type !== 'string' ||
        (message.type !== 'user_audio' && message.type !== 'user')
      ) {
        console.warn('Invalid message:', message);
        return;
      }

      broadcast({
        content: message.content,
        author: clientId,
        timestamp: Date.now(),
        type: message.type,
      });

    } catch (error) {
      console.error('Error processing message:', error.message);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log('Client disconnected');

    broadcastClientCount();
    broadcast({
      content: '',
      type: 'user_disconnect',
      timestamp: Date.now(),
      author: clientId,
    });
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});
