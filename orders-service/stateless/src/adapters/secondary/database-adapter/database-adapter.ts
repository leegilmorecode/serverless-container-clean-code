import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

import { Order } from '@dto/create-order';
import { config } from '@config/config';
import { logger } from '@shared/index';
import { marshall } from '@aws-sdk/util-dynamodb';

const dynamoDb = new DynamoDBClient({});

export async function saveOrder(createOrderDto: Order): Promise<Order> {
  const tableName = config.get('tableName');

  const params = {
    TableName: tableName,
    Item: marshall(createOrderDto),
  };

  try {
    await dynamoDb.send(new PutItemCommand(params));

    logger.info(`order created with ${createOrderDto.id} into ${tableName}`);

    return createOrderDto;
  } catch (error) {
    console.error('error creating order:', error);
    throw error;
  }
}
