import { getISOString, logger, schemaValidator } from '@shared/index';

import { Order } from '@dto/create-order';
import { saveOrder } from '@adapters/secondary/database-adapter';
import { schema } from '@schemas/order';
import { v4 as uuid } from 'uuid';

export async function createOrderUseCase(order: Order): Promise<Order> {
  const created = getISOString();

  // create the order object and add the id and created date
  const orderDto: Order = {
    id: uuid(),
    created,
    ...order,
  };

  // Note - you would do your super duper business logic here

  logger.info(`order: ${JSON.stringify(order)}`);

  schemaValidator(schema, orderDto);

  // save the created order using the secondary adapter
  await saveOrder(orderDto);

  logger.info(`order with ${orderDto.id} saved`);

  return orderDto;
}
