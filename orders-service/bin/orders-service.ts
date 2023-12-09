#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { OrdersServiceStatefulStack } from '../stateful/stateful';
import { OrdersServiceStatelessStack } from '../stateless/stateless';

const app = new cdk.App();
const ordersServiceStatefulStack = new OrdersServiceStatefulStack(
  app,
  'OrdersServiceStatefulStack'
);

new OrdersServiceStatelessStack(app, 'OrdersServiceStatelessStack', {
  table: ordersServiceStatefulStack.table,
});
