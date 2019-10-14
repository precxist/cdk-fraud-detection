import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import iam = require('@aws-cdk/aws-iam');
import kinesis = require('@aws-cdk/aws-kinesis');
import lambda = require('@aws-cdk/aws-lambda');
import sns = require('@aws-cdk/aws-sns');
import { KinesisEventSource } from '@aws-cdk/aws-lambda-event-sources';


export class LambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create a S3 bucket for archiving inference results
    const fraudScoreBucket = new s3.Bucket(this, 'fraud-detection-score-bucket', {
      bucketName: 'fraud-detection-score-bucket'
    });

    const fraudDetectionLambdaExecutionRole = new iam.Role(this, 'fraudDetectionLambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        { managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole' }
      ]
    });

    new iam.Policy(this, 'registerStreamsFunctionExecutionPolicy', {
      statements: [
        new iam.PolicyStatement({
          actions: ['sagemaker:InvokeEndpoint'],
          effect: iam.Effect.ALLOW,
          resources: ["*"]
        }),
        new iam.PolicyStatement({
            actions: ['sns:Publish'],
            effect: iam.Effect.ALLOW,
            resources: ["*"]
        }),
        new iam.PolicyStatement({
            actions: [
                "kinesis:SubscribeToShard",
                "kinesis:DescribeStreamSummary",
                "kinesis:DescribeStreamConsumer",
                "kinesis:GetShardIterator",
                "kinesis:GetRecords",
                "kinesis:DescribeStream",
                "kinesis:ListTagsForStream"
            ],
            effect: iam.Effect.ALLOW,
            resources: ["*"]
        }),
        new iam.PolicyStatement({
          actions: [
            "s3:AbortMultipartUpload",
            "s3:GetBucketLocation",
            "s3:GetObject",
            "s3:ListBucket",
            "s3:ListBucketMultipartUploads",
            "s3:PutObject"
          ],
          effect: iam.Effect.ALLOW,
          resources: [
            fraudScoreBucket.bucketArn,
            fraudScoreBucket.bucketArn + "/*"
          ]
        }),
      ]
    }).attachToRole(fraudDetectionLambdaExecutionRole);

    const inputStreamArn = cdk.Fn.importValue("input-stream-ARN")
    const inputStream = kinesis.Stream.fromStreamArn(
      this, 
      "fraud-detection-input-stream", 
      inputStreamArn
    );

    const snsTopicArn = cdk.Fn.importValue("sns-topic-ARN");

    const fraudDetectionLambda = new lambda.Function(this, 'fraudDetectionLambda', {
      code: lambda.Code.fromAsset('./lib/lambda'),
      handler: 'main.handler',
      runtime: lambda.Runtime.PYTHON_3_6,
      role: fraudDetectionLambdaExecutionRole,
      environment: {
        ENDPOINT_NAME: "fraud-detection-xgboost-final",
        SNS_TOPIC_ARN: snsTopicArn,
        SCORE_BUCKET_NAME: fraudScoreBucket.bucketName,
      },
    });

    fraudDetectionLambda.addEventSource(
      new KinesisEventSource(inputStream, {
        batchSize: 1000, // default
        startingPosition: lambda.StartingPosition.TRIM_HORIZON
      })
    );


  }
}
