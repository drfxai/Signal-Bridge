
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
});

function parseMessage(message) {
  if (typeof message !== 'string' || message.length > 16_384) return null;
  try {
    const body = JSON.parse(message);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    return body;
  } catch { return null; }
}

export class AgentHub {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/ws') {
      if ((request.headers.get('upgrade') || '').toLowerCase() !== 'websocket') {
        return json({error:'UPGRADE_REQUIRED'}, 426);
      }

      const agentId = request.headers.get('x-sb-agent-id') || '';
      const tenantId = request.headers.get('x-sb-tenant-id') || '';
      if (!agentId || !tenantId) return json({error:'UNAUTHORIZED'}, 401);

      const pair = new WebSocketPair();
      const client = pair[0], server = pair[1];
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({
        agentId,
        tenantId,
        connectedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString()
      });
      server.send(JSON.stringify({
        type:'hello',
        protocol:'signalbridge-agent/1',
        agent_id:agentId,
        execution_enabled:false
      }));
      return new Response(null, {status:101, webSocket:client});
    }

    if (url.pathname === '/dispatch' && request.method === 'POST') {
      const body = await request.json().catch(()=>null);
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({error:'BAD_PAYLOAD'}, 400);
      const sockets = this.ctx.getWebSockets();
      let delivered = 0;
      const payload = JSON.stringify({type:'command', ...body});
      for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
          delivered++;
        }
      }
      return json({ok:true,delivered});
    }

    if (url.pathname === '/snapshot' && request.method === 'GET') {
      const sockets = this.ctx.getWebSockets();
      const clients = sockets.map(ws => {
        const a = ws.deserializeAttachment() || {};
        return {
          agent_id:a.agentId || null,
          connected_at:a.connectedAt || null,
          last_seen_at:a.lastSeenAt || null
        };
      });
      return json({connected:clients.length,clients});
    }

    return json({error:'NOT_FOUND'}, 404);
  }

  async webSocketMessage(ws, message) {
    const body = parseMessage(message);
    if (!body) {
      ws.send(JSON.stringify({type:'error',code:'INVALID_MESSAGE'}));
      return;
    }

    const attachment = ws.deserializeAttachment() || {};
    attachment.lastSeenAt = new Date().toISOString();
    if (body.type === 'heartbeat') {
      if (body.account && typeof body.account === 'object') {
        attachment.account = {
          login: String(body.account.login ?? '').slice(0,64),
          server: String(body.account.server ?? '').slice(0,120),
          mode: String(body.account.mode ?? '').slice(0,32),
          equity: Number.isFinite(Number(body.account.equity)) ? Number(body.account.equity) : null,
          balance: Number.isFinite(Number(body.account.balance)) ? Number(body.account.balance) : null
        };
      }
      ws.serializeAttachment(attachment);
      ws.send(JSON.stringify({type:'heartbeat_ack',server_time:new Date().toISOString()}));
      return;
    }

    if (body.type === 'receipt') {
      ws.serializeAttachment(attachment);
      ws.send(JSON.stringify({type:'receipt_ack',command_id:String(body.command_id || '')}));
      return;
    }

    ws.send(JSON.stringify({type:'error',code:'UNSUPPORTED_MESSAGE'}));
  }

  async webSocketClose(ws, code, reason) {
    try { ws.close(code || 1000, String(reason || '').slice(0,120)); } catch {}
  }

  async webSocketError(ws) {
    try { ws.close(1011, 'socket error'); } catch {}
  }
}
