#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { KinesisStack } from '../lib/kinesis-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { SNSStack } from '../lib/sns-stack';

const app = new cdk.App();

const kinesisStack = new KinesisStack(
    app, 
    'fraud-detection-kinesis-stack', 
    {
        stackName: 'fraud-detection-kinesis-stack',
        env: {region: "ap-northeast-1"}
    }
);

const snsStack = new SNSStack(
    app, 
    'fraud-detection-sns-stack',
    {
        stackName: 'fraud-detection-sns-stack',
        env: {region: "ap-northeast-1"},
    }
);

const lambdaStack = new LambdaStack(
    app, 
    'fraud-detection-lambda-stack',
    {
        stackName: 'fraud-detection-lambda-stack',
        env: {region: "ap-northeast-1"}
    }
);

lambdaStack.addDependency(kinesisStack);
lambdaStack.addDependency(snsStack);
