import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'node:http';
import { resetGuardrailsConfigCache } from '../../src/config/guardrails.js';

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

test('guardrails: close requires minimum feedback', async (t) => {
  const tmpData = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-guard-'));
  process.env.DATA_ROOT = tmpData;
  resetGuardrailsConfigCache();

  const { createApp } = await import('../../src/app.js');
  const server = createApp().listen(0);
  const port = server.address().port;

  t.after(async () => {
    await new Promise((r) => server.close(r));
    await fs.rm(tmpData, { recursive: true, force: true });
    delete process.env.DATA_ROOT;
    resetGuardrailsConfigCache();
  });

  const created = await apiRequest(port, 'POST', '/api/retrospectives', {
    title: 'Guardrail Retro',
    team: 'Demo',
    period: 'Sprint 1',
  });
  const retroId = created.body.id;
  await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/open`);

  for (let i = 0; i < 2; i++) {
    await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/feedback`, {
      type: 'went-well',
      text: `Feedback item ${i + 1}`,
      anonymous: true,
      displayName: null,
    });
  }

  const closeFail = await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/close`);
  assert.equal(closeFail.status, 400);
  assert.match(closeFail.body.error, /at least 3 feedback/i);

  await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/feedback`, {
    type: 'improvement',
    text: 'Third feedback item',
    anonymous: true,
    displayName: null,
  });

  const closeOk = await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/close`);
  assert.equal(closeOk.status, 200);
  assert.equal(closeOk.body.status, 'closed');
});

test('guardrails: approve suggestion requires explicit confirmation and rejects blame', async (t) => {
  const tmpData = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-guard-'));
  process.env.DATA_ROOT = tmpData;
  resetGuardrailsConfigCache();

  const { createApp } = await import('../../src/app.js');
  const server = createApp().listen(0);
  const port = server.address().port;

  t.after(async () => {
    await new Promise((r) => server.close(r));
    await fs.rm(tmpData, { recursive: true, force: true });
    delete process.env.DATA_ROOT;
    resetGuardrailsConfigCache();
  });

  const created = await apiRequest(port, 'POST', '/api/retrospectives', {
    title: 'Approval Retro',
    team: 'Demo',
    period: 'Sprint 1',
  });
  const retroId = created.body.id;
  await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/open`);

  const feedbackIds = [];
  for (let i = 0; i < 3; i++) {
    const fb = await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/feedback`, {
      type: 'went-well',
      text: `Item ${i}`,
      anonymous: true,
      displayName: null,
    });
    feedbackIds.push(fb.body.id);
  }
  await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/close`);

  const imported = await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/analysis/import`, {
    themes: [],
    strengths: [],
    concerns: [],
    opportunities: [],
    suggestedActions: [
      {
        id: 'SUG-001',
        title: 'Blame the team for the fault in delivery',
        reason: 'Process gap in planning',
        sourceFeedbackIds: [feedbackIds[0]],
        ownerTeams: ['dev-team'],
      },
      {
        id: 'SUG-002',
        title: 'Time-box planning sessions',
        reason: 'Planning runs too long',
        sourceFeedbackIds: [feedbackIds[1]],
        ownerTeams: ['product-team', 'management-team'],
      },
    ],
    limitations: ['Suggested actions require human review before approval.'],
  });
  assert.equal(imported.status, 200);

  const noConfirm = await apiRequest(
    port,
    'POST',
    `/api/retrospectives/${retroId}/actions/from-suggestion/SUG-002`,
    {}
  );
  assert.equal(noConfirm.status, 400);
  assert.match(noConfirm.body.error, /approvalConfirmation/i);

  const blame = await apiRequest(
    port,
    'POST',
    `/api/retrospectives/${retroId}/actions/from-suggestion/SUG-001`,
    { approvalConfirmation: 'approve SUG-001' }
  );
  assert.equal(blame.status, 400);
  assert.match(blame.body.error, /blame/i);

  const ok = await apiRequest(
    port,
    'POST',
    `/api/retrospectives/${retroId}/actions/from-suggestion/SUG-002`,
    { approvalConfirmation: 'approve SUG-002' }
  );
  assert.equal(ok.status, 200);
  assert.equal(ok.body.source, 'approved-suggestion');
  assert.deepEqual(ok.body.ownerTeams, ['product-team', 'management-team']);
  assert.match(ok.body.owner, /Product Team/);
});

test('guardrails: report and archive require approved actions and report', async (t) => {
  const tmpData = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-guard-'));
  process.env.DATA_ROOT = tmpData;
  resetGuardrailsConfigCache();

  const { createApp } = await import('../../src/app.js');
  const server = createApp().listen(0);
  const port = server.address().port;

  t.after(async () => {
    await new Promise((r) => server.close(r));
    await fs.rm(tmpData, { recursive: true, force: true });
    delete process.env.DATA_ROOT;
    resetGuardrailsConfigCache();
  });

  const created = await apiRequest(port, 'POST', '/api/retrospectives', {
    title: 'Report Retro',
    team: 'Demo',
    period: 'Sprint 1',
  });
  const retroId = created.body.id;
  await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/open`);

  const feedbackIds = [];
  for (let i = 0; i < 3; i++) {
    const fb = await apiRequest(port, 'POST', `/api/retrospectives/${retroId}/feedback`, {
      type: 'went-well',
      text: `Item ${i}`,
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
        title: 'Time-box planning',
        reason: 'Planning runs long',
        sourceFeedbackIds: [feedbackIds[0]],
        ownerTeams: ['product-team'],
      },
    ],
    limitations: ['Suggested actions require human review before approval.'],
  });

  const reportNoActions = await apiRequest(
    port,
    'POST',
    `/api/retrospectives/${retroId}/report/generate`,
    {}
  );
  assert.equal(reportNoActions.status, 400);
  assert.match(reportNoActions.body.error, /Approve at least one/i);

  await apiRequest(
    port,
    'POST',
    `/api/retrospectives/${retroId}/actions/from-suggestion/SUG-001`,
    { approvalConfirmation: 'approve SUG-001' }
  );

  const reportOk = await apiRequest(
    port,
    'POST',
    `/api/retrospectives/${retroId}/report/generate`,
    {}
  );
  assert.equal(reportOk.status, 200);

  const archiveOk = await apiRequest(
    port,
    'POST',
    `/api/retrospectives/${retroId}/archive`,
    {}
  );
  assert.equal(archiveOk.status, 200);
  assert.equal(archiveOk.body.status, 'archived');
});
