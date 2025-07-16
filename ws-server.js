const express = require('express');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, () => {
  console.log(`WebSocket сервер запущен на порту ${PORT}`);
});

const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Клиент подключился');
  clients.add(ws);

  ws.on('message', (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString());

      if (typeof message.text !== 'string' || typeof message.author !== 'string') {
        console.warn('Невалидное сообщение:', message);
        return;
      }

      const broadcastMessage = JSON.stringify({
        text: message.text,
        author: message.author,
        timestamp: Date.now(),
      });

      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(broadcastMessage);
        }
      }

    } catch (error) {
      console.error('Ошибка обработки сообщения:', error.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Клиент отключился');
  });

  ws.on('error', (err) => {
    console.error('WebSocket ошибка:', err.message);
  });
});
