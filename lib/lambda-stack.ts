import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import kinesis = require('@aws-cdk/aws-kinesis');
import lambda = require('@aws-cdk/aws-lambda');
import sns = require('@aws-cdk/aws-sns');

export class LambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*****************************************/
    /************* Lambda - Begin ************/
    /*****************************************/
    const fraudDetectionLambdaExecutionRole = new iam.Role(this, 'fraudDetectionLambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
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
      ]
    }).attachToRole(fraudDetectionLambdaExecutionRole);

    const fraudDetectionLambda = new lambda.Function(this, 'fraudDetectionLambda', {
      code: lambda.Code.fromAsset('./lib/lambda'),
      handler: 'main.handler',
      runtime: lambda.Runtime.PYTHON_3_6,
      role: fraudDetectionLambdaExecutionRole,
      environment: {
        // TABLE_NAME: config.rigTable.name,
        // PRIMARY_KEY: config.rigTablePartitionKey
      },
    });

     // Please note that the exportName could be referenced by any other external stacks
    // So exportName should be unique globally
    const lambdaArnExportName = "lambda-ARN";

    new cdk.CfnOutput(this, lambdaArnExportName, {
      value: fraudDetectionLambda.functionArn,
      exportName: lambdaArnExportName
    })
    /*****************************************/
    /************** Lambda - End *************/
    /*****************************************/

    // const sns_topic = new sns.Topic(this, 'CdkSampleTopic');
    // sns_topic.addSubscription("");

    // // Please note that the exportName could be referenced by any other external stacks
    // // So exportName should be unique globally
    // new cdk.CfnOutput(this, config.getRigConfigLambdaArnExportName, {
    //   value: fraudDetectionLambda.functionArn,
    //   exportName: config.getRigConfigLambdaArnExportName
    // })

    // this.result = new CommonProps(fraudDetectionLambda.functionName, fraudDetectionLambda.functionArn);

  }
}
