export const schema = {
  type: 'object',
  required: ['id', 'orderTotal', 'orderStatus', 'orderLines', 'created'],
  maxProperties: 5,
  minProperties: 5,
  properties: {
    id: {
      type: 'string',
    },
    orderTotal: {
      type: 'number',
    },
    orderStatus: {
      type: 'string',
      enum: ['VALID', 'INVALID'],
    },
    created: {
      type: 'string',
    },
    orderLines: {
      type: 'array',
      items: {
        type: 'object',
        required: ['quantity', 'productId', 'total'],
        properties: {
          quantity: {
            type: 'number',
          },
          productId: {
            type: 'string',
          },
          total: {
            type: 'number',
          },
        },
      },
    },
  },
};
