import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'node:http';

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
          let parsed = null;
          try {
            parsed = data ? JSON.parse(data) : null;
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('report insights import and generate', async (t) => {
  const tmpData = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-insights-'));
  process.env.DATA_ROOT = tmpData;

  const { createApp } = await import('../../src/app.js');
  const server = createApp().listen(0);
  const port = server.address().port;

  t.after(async () => {
    await new Promise((r) => server.close(r));
    await fs.rm(tmpData, { recursive: true, force: true });
    delete process.env.DATA_ROOT;
  });

  const created = await apiRequest(port, 'POST', '/api/retrospectives', {
    title: 'Insights Retro',
    team: 'Demo',
    period: 'Sprint 1',
  });
  const retroId = created.body.id;
  await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/open`);

  const feedbackIds = [];
  for (let i = 0; i < 3; i++) {
    const fb = await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/feedback`, {
      type: i === 0 ? 'went-well' : i === 1 ? 'did-not-go-well' : 'improvement',
      text: `Feedback ${i}`,
      anonymous: true,
      displayName: null,
    });
    feedbackIds.push(fb.body.id);
  }
  await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/close`);

  await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/analysis/import`, {
    themes: [],
    strengths: [],
    concerns: [],
    opportunities: [],
    suggestedActions: [
      {
        id: 'SUG-001',
        title: 'Improve review flow',
        reason: 'Reviews slow',
        sourceFeedbackIds: [feedbackIds[1]],
        ownerTeams: ['dev-team'],
      },
    ],
    limitations: ['Suggested actions require human review before approval.'],
  });

  await apiRequest(
    port,
    'POST',
    `/api/retrospectives/${retroId}/actions/from-suggestion/SUG-001`,
    { approvalConfirmation: 'approve SUG-001' }
  );

  const insightsPayload = {
    generatedBy: 'cursor-agent',
    participationMix: { wentWell: 1, didNotGoWell: 1, improvement: 1 },
    topicBreakdown: [
      {
        label: 'Process friction',
        feedbackIds: [feedbackIds[1], feedbackIds[2]],
        priority: 'medium',
        summary: 'The team noted process friction in two feedback items.',
      },
    ],
    recurringTopics: [
      {
        label: 'Process friction',
        retroIds: [retroId],
        priority: 'low',
        summary: 'First retrospective with this theme.',
      },
    ],
    limitations: ['Counts reflect feedback items, not individuals.'],
  };

  const imported = await apiRequest(
    port,
    'POST',
    `/api/retrospectives/${retroId}/report/insights/import`,
    insightsPayload
  );
  assert.equal(imported.status, 200);
  assert.equal(imported.body.topicBreakdown[0].feedbackItems, 2);
  assert.equal(imported.body.topicBreakdown[0].percent, 67);

  const got = await apiRequest(port, 'GET', `/api/retrospectives/${retroId}/report/insights`);
  assert.equal(got.status, 200);

  const report = await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/report/generate`);
  assert.equal(report.status, 200);
  assert.match(report.body.markdown, /Insights at a Glance/);
  assert.match(report.body.markdown, /feedback items, not individuals/i);
});
