import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const requestLogger = new Logger('HTTP');
  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();
    const incomingRequestId = request.header('x-request-id');
    const requestId = incomingRequestId?.slice(0, 100) || randomUUID();
    response.setHeader('x-request-id', requestId);
    response.on('finish', () => {
      requestLogger.log(
        JSON.stringify({
          requestId,
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        }),
      );
    });
    next();
  });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
