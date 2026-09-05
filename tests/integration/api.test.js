import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'node:http';

// Lightweight integration test without supertest dependency
function apiRequest(port, method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = request.request(
      {
        hostname: 'localhost',
        port,
        path: urlPath,
        method,
        headers: body
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
          : {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('API health and retrospective lifecycle', async (t) => {
  const tmpData = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-api-'));
  process.env.DATA_ROOT = tmpData;

  const { createApp } = await import('../../src/app.js');
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;

  t.after(async () => {
    await new Promise((r) => server.close(r));
    await fs.rm(tmpData, { recursive: true, force: true });
    delete process.env.DATA_ROOT;
  });

  const health = await apiRequest(port, 'GET', '/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.status, 'ok');

  const created = await apiRequest(port, 'POST', '/api/retrospectives', {
    title: 'Sprint 1 Retro',
    team: 'Demo Team',
    period: 'Sprint 1',
  });
  assert.equal(created.status, 200);
  assert.match(created.body.id, /^RETRO-/);

  const retroId = created.body.id;
  await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/open`);
  const feedback = await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/feedback`, {
    type: 'went-well',
    text: 'Testing started earlier this sprint.',
    anonymous: true,
    displayName: null,
  });
  assert.equal(feedback.status, 200);
  assert.equal(feedback.body.displayName, null);
});
