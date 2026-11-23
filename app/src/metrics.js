
'use strict';

const client = require('prom-client');

const registry = new client.Registry();

// Node.js CPU, memory and process metrics
client.collectDefaultMetrics({
  register: registry,
  prefix: 'status_api_'
});

const httpRequestsTotal = new client.Counter({
  name: 'status_api_http_requests_total',
  help: 'Total HTTP requests handled by the status API',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry]
});

const httpRequestDuration = new client.Histogram({
  name: 'status_api_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry]
});

const knownRoutes = new Set([
  '/',
  '/health/live',
  '/health/ready',
  '/api/version'
]);

function observeRequest(method, pathname, statusCode, durationSeconds) {
  // Prevent high-cardinality labels for unknown routes.
  const route = knownRoutes.has(pathname) ? pathname : '/other';

  const labels = {
    method,
    route,
    status_code: String(statusCode)
  };

  httpRequestsTotal.inc(labels);
  httpRequestDuration.observe(labels, durationSeconds);
}

module.exports = {
  registry,
  observeRequest
};
