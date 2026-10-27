
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBearer } from '../worker/src/agent-auth.mjs';

test('agent bearer auth accepts exactly 43-char base64url token',()=>{
  const token='A'.repeat(43);
  const request=new Request('https://example.test',{headers:{authorization:'Bearer '+token}});
  assert.equal(parseBearer(request),token);
});

test('agent bearer auth rejects malformed credentials',()=>{
  for(const value of ['', 'Basic abc', 'Bearer short', 'Bearer '+('A'.repeat(42))+'=']){
    const request=new Request('https://example.test',{headers:{authorization:value}});
    assert.equal(parseBearer(request),null);
  }
});


test('agent token can authenticate through WebSocket subprotocol without URL secrets',()=>{
 const token='B'.repeat(43);
 const request=new Request('https://example.test',{headers:{'sec-websocket-protocol':'sb-token.'+token}});
 assert.equal(parseBearer(request),token);
});
