import { APIGatewayProxyResult } from 'aws-lambda';
import { FastifyReply } from 'fastify';
import { logger } from '@shared/logger';

// our error handler function for our containers i.e. fastify
export function serviceErrorHandler(
  error: any,
  reply: FastifyReply
): FastifyReply {
  let errorMessage = 'Unknown error';
  let statusCode: number;

  if (error instanceof Error) errorMessage = error.message;
  // log the original error
  logger.error(error.message);

  if (error instanceof Error) {
    switch (error.name) {
      case 'ValidationError':
        errorMessage = error.message;
        statusCode = 400;
        break;
      case 'ResourceNotFound':
        errorMessage = error.message;
        statusCode = 404;
        break;
      default:
        errorMessage = 'An error has occurred';
        statusCode = 500;
        break;
    }
  } else {
    errorMessage = 'An error has occurred';
    statusCode = 500;
  }

  logger.error(errorMessage);

  return reply.status(statusCode).send(errorMessage);
}

// our generic error handler for lambda functions
export function errorHandler(error: Error | unknown): APIGatewayProxyResult {
  console.error(error);

  let errorMessage: string;
  let statusCode: number;

  if (error instanceof Error) {
    switch (error.name) {
      case 'ValidationError':
        errorMessage = error.message;
        statusCode = 400;
        break;
      case 'ResourceNotFound':
        errorMessage = error.message;
        statusCode = 404;
        break;
      default:
        errorMessage = 'An error has occurred';
        statusCode = 500;
        break;
    }
  } else {
    errorMessage = 'An error has occurred';
    statusCode = 500;
  }

  logger.error(errorMessage);

  return {
    statusCode: statusCode,
    body: JSON.stringify(errorMessage),
  };
}
