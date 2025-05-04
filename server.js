const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const clients = new Set();

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => ws.isAlive = true);

  clients.add(ws);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (e) {
      console.error("Error parsing message:", e);
      return;
    }

    if (msg.type === 'login') {
      ws.username = msg.name.trim().substring(0, 20) || 'Anonymous';
      console.log(`${ws.username} logged in`);
    }

    if (msg.type === 'chat' && ws.username) {
      broadcast({
        type: 'chat',
        from: ws.username,
        text: msg.text.trim().substring(0, 200),
      });
    }
  });

  ws.on('close', () => {
    console.log(`${ws.username} disconnected`);
    clients.delete(ws);
  });
});

function broadcast(payload) {
  const raw = JSON.stringify(payload);
  for (let client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(raw);
    }
  }
}

setInterval(() => {
  for (let ws of clients) {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

console.log('WebSocket server listening on ws://localhost:8080');
