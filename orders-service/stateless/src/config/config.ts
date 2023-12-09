const convict = require('convict');

export const config = convict({
  tableName: {
    doc: 'The database table where we store orders',
    format: String,
    default: 'tableName',
    env: 'TABLE_NAME',
  },
  address: {
    doc: 'The container address',
    format: String,
    default: '0.0.0.0',
    env: 'ADDRESS',
  },
  port: {
    doc: 'The container port',
    format: String,
    default: '80',
    env: 'PORT',
  },
}).validate({ allowed: 'strict' });
