import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    // Anything that isn't an HttpException is a bug, not an expected client
    // error — log the full detail server-side and report it, but never let
    // the stack trace or error message reach the response body.
    this.logger.error(
      JSON.stringify({ requestId: request.header('x-request-id'), path: request.path, error: String(exception) }),
      exception instanceof Error ? exception.stack : undefined,
    );
    Sentry.captureException(exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Beklenmeyen bir hata oluştu',
    });
  }
}
