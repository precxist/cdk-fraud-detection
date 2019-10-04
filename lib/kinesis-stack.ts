import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import logs = require('@aws-cdk/aws-logs');
import s3 = require('@aws-cdk/aws-s3');
import kinesis = require('@aws-cdk/aws-kinesis');
import kinesisfirehose = require('@aws-cdk/aws-kinesisfirehose');

export class KinesisStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create Kinesis data stream
    const inputStream = new kinesis.Stream(this, 'fraud-detection-input-stream', {});

    // create a S3 bucket for delivery stream
    const firehoseBucket = new s3.Bucket(this, 'fraud-detection-firehose-bucket', {
      bucketName: 'fraud-detection-firehose-bucket'
    });

    // IAM policy & role for Firehose delivery stream
    const firehoseRole = new iam.Role(this, 'fraud-detection-firehose-role', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });
    
    const firehosePolicy = new iam.Policy(this, 'fraud-detection-firehose-policy', {
      statements: [
        new iam.PolicyStatement({
          actions: [
            "glue:GetTableVersions",
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
            firehoseBucket.bucketArn,
            firehoseBucket.bucketArn + "/*"
          ]
        }),
        new iam.PolicyStatement({
          actions: [
            "lambda:InvokeFunction",
            "lambda:GetFunctionConfiguration"
          ],
          effect: iam.Effect.ALLOW,
          resources: [
            "arn:aws:lambda:ap-northeast-2::function:%FIREHOSE_DEFAULT_FUNCTION%:%FIREHOSE_DEFAULT_VERSION%"
          ]
        }),
        new iam.PolicyStatement({
          actions: [
            "logs:PutLogEvents"
          ],
          effect: iam.Effect.ALLOW,
          resources: [
            "arn:aws:logs:*:log-group:/aws/kinesisfirehose/*:log-stream:*"
          ]
        }),
        new iam.PolicyStatement({
          actions: [
            "kinesis:DescribeStream",
            "kinesis:GetShardIterator",
            "kinesis:GetRecords"
          ],
          effect: iam.Effect.ALLOW,
          resources: [
            inputStream.streamArn
          ]
        }),
        new iam.PolicyStatement({
          actions: [
            "kms:Decrypt"
          ],
          effect: iam.Effect.ALLOW,
          resources: [
            "arn:aws:kms:*:*:key/%SSE_KEY_ID%"
          ],
          conditions: {
              StringEquals: {
                "kms:ViaService": "kinesis.amazonaws.com"
              },
              StringLike: {
                "kms:EncryptionContext:aws:kinesis:arn": inputStream.streamArn
              }
          }
        }),
      ]
    });
    firehosePolicy.attachToRole(firehoseRole);

    // create Kinesis Firehose delivery stream
    const deliveryStream = new kinesisfirehose.CfnDeliveryStream(
      this, "delivery-stream", {
        deliveryStreamType: "KinesisStreamAsSource",
        kinesisStreamSourceConfiguration: {
          kinesisStreamArn: inputStream.streamArn,
          roleArn: firehoseRole.roleArn
        },
        extendedS3DestinationConfiguration: {
          bucketArn: firehoseBucket.bucketArn,
          bufferingHints: {
            intervalInSeconds : 60,
            sizeInMBs : 10
          },
          compressionFormat: "UNCOMPRESSED",
          roleArn: firehoseRole.roleArn
        }
      }
    );
    
    deliveryStream.node.addDependency(firehoseRole);
    deliveryStream.node.addDependency(firehosePolicy);

    // Please note that the exportName could be referenced by any other external stacks
    // So exportName should be unique globally
    const inputStreamArnExportName = "input-stream-ARN";

    new cdk.CfnOutput(this, inputStreamArnExportName, {
      value: inputStream.streamArn,
      exportName: inputStreamArnExportName
    })

    // this.result = new CommonProps(fraudDetectionLambda.functionName, fraudDetectionLambda.functionArn);
  }
}
