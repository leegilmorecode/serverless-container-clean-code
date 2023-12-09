import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

import { Construct } from 'constructs';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Tracing } from 'aws-cdk-lib/aws-lambda';

export interface StatelessStackProps extends cdk.StackProps {
  table: dynamodb.Table;
}

export class OrdersServiceStatelessStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: StatelessStackProps) {
    super(scope, id, props);

    this.table = props.table;

    const lambdaPowerToolsConfig = {
      LOG_LEVEL: 'DEBUG',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_TRACE_ENABLED: 'enabled',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'captureHTTPsRequests',
      POWERTOOLS_SERVICE_NAME: 'OrdersService',
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'captureResult',
      POWERTOOLS_METRICS_NAMESPACE: 'OrdersNamespace',
    };

    // create the lambda for create order
    const createOrderLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'CreateOrder', {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          'src/adapters/primary/create-order/create-order.adapter.ts'
        ),
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        tracing: Tracing.ACTIVE,
        handler: 'handler',
        bundling: {
          minify: true,
          externalModules: [],
        },
        environment: {
          TABLE_NAME: this.table.tableName,
          ...lambdaPowerToolsConfig,
        },
      });

    // add the iam role to allow app runner access to ecr
    const accessRole = new iam.Role(this, 'AppRunnerBuildRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
    });

    accessRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:BatchCheckLayerAvailability',
          'ecr:BatchGetImage',
          'ecr:DescribeImages',
          'ecr:GetAuthorizationToken',
          'ecr:GetDownloadUrlForLayer',
        ],
        resources: ['*'],
      })
    );

    // give the app runner service access to writing to dynamodb
    const instanceRole = new iam.Role(this, 'AppRunnerServiceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
    });

    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PutItem'],
        resources: [this.table.tableArn],
      })
    );

    // allows building the docker image and uploading to ecr
    const imageAsset = new DockerImageAsset(this, 'ImageAssets', {
      directory: path.join(__dirname, '../'),
    });

    // create the apprunner service
    const service: apprunner.Service = new apprunner.Service(this, 'Service', {
      accessRole,
      instanceRole,
      serviceName: 'orders-service-app-runner',
      cpu: apprunner.Cpu.QUARTER_VCPU,
      memory: apprunner.Memory.HALF_GB,
      healthCheck: apprunner.HealthCheck.http({
        path: '/health-check',
        interval: cdk.Duration.seconds(20),
        timeout: cdk.Duration.seconds(5),
        healthyThreshold: 3,
        unhealthyThreshold: 3,
      }),
      source: apprunner.Source.fromAsset({
        imageConfiguration: { port: 80 },
        asset: imageAsset,
      }),
      autoDeploymentsEnabled: true,
    });
    service.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // add the container environment variables
    service.addEnvironmentVariable('TABLE_NAME', this.table.tableName);
    service.addEnvironmentVariable('ADDRESS', '0.0.0.0');
    service.addEnvironmentVariable('PORT', '80');
    service.addEnvironmentVariable('POWERTOOLS_SERVICE_NAME', 'OrdersService');
    service.addEnvironmentVariable(
      'POWERTOOLS_TRACER_CAPTURE_RESPONS',
      'captureResult'
    );
    service.addEnvironmentVariable(
      'POWERTOOLS_METRICS_NAMESPACE',
      'OrdersNamespace'
    );

    // give the lambda access to the dynamodb table
    this.table.grantWriteData(createOrderLambda);

    // create the api gateway for orders
    const api: apigw.RestApi = new apigw.RestApi(this, 'OrdersApi', {
      description: 'Orders API',
      endpointTypes: [apigw.EndpointType.REGIONAL],
      deploy: true,
      deployOptions: {
        stageName: 'prod',
        dataTraceEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        tracingEnabled: true,
        metricsEnabled: true,
      },
    });
    api.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // create the orders resource and add a post endpoing for our function
    const orders: apigw.Resource = api.root.addResource('orders');
    orders.addMethod(
      'POST',
      new apigw.LambdaIntegration(createOrderLambda, {
        proxy: true,
      })
    );

    new cdk.CfnOutput(this, 'OrdersServiceUrl', {
      value: `https://${service.serviceUrl}`,
    });
  }
}
