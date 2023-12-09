import { logger, schemaValidator, serviceErrorHandler } from '@shared/index';

import { Order } from '@dto/create-order';
import { config } from '@config/index';
import { createOrderUseCase } from '@use-cases/create-order';
import fastify from 'fastify';
import { schema } from '@schemas/create-order';

const server = fastify({
  logger: false,
});

const address = config.get('address');
const port = config.get('port');

server.get('/', async () => {
  return { version: 'v1' };
});

server.get('/health-check', async () => {
  logger.debug('healthcheck successfull');
  return { status: 'healthy' };
});

// this is the same as our api gateway and lambda intergration for creating orders
server.post('/orders', async (request, reply) => {
  try {
    const orderPayload = request.body as Order;
    logger.info(`order payload: ${JSON.stringify(orderPayload)}`);

    // validate the order payload for create order
    schemaValidator(schema, orderPayload);

    // use the use case for the actual business logic and secondary adapters
    const createdOrder: Order = await createOrderUseCase(orderPayload);

    return reply.status(201).send(createdOrder);
  } catch (error) {
    return serviceErrorHandler(error, reply);
  }
});

server.listen({ host: address, port: parseInt(port, 10) }, (err, address) => {
  if (err) {
    logger.error(err.message);
    process.exit(1);
  }
  logger.info(`server listening at ${address}`);
});
