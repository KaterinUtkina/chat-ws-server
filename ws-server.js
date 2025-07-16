const WebSocket = require('ws');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, () => {
  console.log(`HTTP/WebSocket сервер запущен на порту ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Клиент подключился');

  ws.on('message', async (message) => {
    console.log('Получено сообщение от клиента:', message.toString());

    const userText = message.toString();
    const reply = `Ответ: "${userText}"`;

    ws.send(reply);
  });

  ws.on('close', () => {
    console.log('Клиент отключился');
  });
});