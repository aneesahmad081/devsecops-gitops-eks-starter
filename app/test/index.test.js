'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createAppServer } = require('../src/index');

async function withServer(run) {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    );
  }
}

test('home route lists the service and endpoints', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/json/);
    const body = await response.json();
    assert.equal(body.service, 'cloudops-status-api');
    assert.ok(body.endpoints.includes('/health/ready'));
  });
});

test('liveness and readiness probes return HTTP 200', async () => {
  await withServer(async (base) => {
    for (const endpoint of ['/health/live', '/health/ready']) {
      const response = await fetch(`${base}${endpoint}`);
      assert.equal(response.status, 200);
      assert.ok((await response.json()).status);
    }
  });
});

test('version endpoint returns configured app version', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/version`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.service, 'cloudops-status-api');
    assert.ok(body.version);
  });
});

test('unknown routes return 404', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/missing`);
    assert.equal(response.status, 404);
  });
});

test('unsupported HTTP methods return 405', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/`, { method: 'POST' });
    assert.equal(response.status, 405);
  });
});
