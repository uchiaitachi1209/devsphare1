import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { scanRoutes } from './routes/scans';
import { healthRoutes } from './routes/health';
import { cyberLabRoutes } from './routes/cyberlab';

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
    bodyLimit: 1048576, // 1MB
  });

  // CORS
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Rate Limiting
  await fastify.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
  });

  // Swagger OpenAPI Docs
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'DevSphere Security API',
        description: 'Next-Generation Automated Website Security Analysis & Intelligence API',
        version: '1.0.0',
      },
      host: process.env.SWAGGER_HOST || undefined,
      schemes: ['https', 'http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Scans', description: 'Website security scans and posture evaluations' },
        { name: 'Health', description: 'System health monitoring and worker status' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Register API Routes under /api/v1
  await fastify.register(scanRoutes, { prefix: '/api/v1' });
  await fastify.register(healthRoutes, { prefix: '/api/v1' });
  await fastify.register(cyberLabRoutes, { prefix: '/api/v1' });

  // Root redirect to docs or health
  fastify.get('/', async (_req, reply) => {
    return reply.redirect('/docs');
  });

  return fastify;
}
