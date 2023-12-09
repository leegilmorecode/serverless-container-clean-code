export const schema = {
  type: 'object',
  required: ['orderTotal', 'orderStatus', 'orderLines'],
  maxProperties: 3,
  minProperties: 3,
  properties: {
    orderTotal: {
      type: 'number',
    },
    orderStatus: {
      type: 'string',
      enum: ['VALID', 'INVALID'],
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
