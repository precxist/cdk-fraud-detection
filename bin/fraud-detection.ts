#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { KinesisStack } from '../lib/kinesis-stack';
import { LambdaStack } from '../lib/lambda-stack';

const app = new cdk.App();

const kinesisStack = new KinesisStack(
    app, 
    'fraud-detection-kinesis-stack', 
    {stackName: 'fraud-detection-kinesis-stack'}
);

const lambdaStack = new LambdaStack(
    app, 
    'fraud-detection-lambda-stack',
    {stackName: 'fraud-detection-lambda-stack'}
);

// kinesisStack.addDependency(lambdaStack);
