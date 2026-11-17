'use strict';

const http = require('node:http');

const APP_NAME = 'cloudops-status-api';
const APP_VERSION = process.env.APP_VERSION || '0.1.0';

function respond(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  res.end(body);
}

function createAppServer() {
  return http.createServer((req, res) => {
    let path;
    try {
      path = new URL(req.url, 'http://localhost').pathname;
    } catch (_) {
      return respond(res, 400, { error: 'Bad request' });
    }

    if (req.method !== 'GET') {
      return respond(res, 405, { error: 'Method not allowed' });
    }

    switch (path) {
      case '/':
        return respond(res, 200, {
          service: APP_NAME,
          message: 'Welcome to the DevSecOps + GitOps learning project',
          endpoints: ['/health/live', '/health/ready', '/api/version']
        });
      case '/health/live':
        return respond(res, 200, { status: 'alive' });
      case '/health/ready':
        return respond(res, 200, { status: 'ready' });
      case '/api/version':
        return respond(res, 200, {
          service: APP_NAME,
          version: APP_VERSION,
          environment: process.env.NODE_ENV || 'development'
        });
      default:
        return respond(res, 404, { error: 'Route not found' });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Invalid PORT');
    process.exit(1);
  }

  const server = createAppServer();
  server.listen(port, '0.0.0.0', () => {
    console.log(`${APP_NAME} listening on port ${port}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { createAppServer };
