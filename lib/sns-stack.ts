import cdk = require('@aws-cdk/core');
import sns = require('@aws-cdk/aws-sns');
import subs = require('@aws-cdk/aws-sns-subscriptions');

export class SNSStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const snsTopic = new sns.Topic(this, 'fraudDetectionTopic');
    snsTopic.addSubscription(new subs.EmailSubscription("minjkang@amazon.com"));

    const snsTopicArnExportName = "sns-topic-ARN"
    // Please note that the exportName could be referenced by any other external stacks
    // So exportName should be unique globally
    new cdk.CfnOutput(this, snsTopicArnExportName, {
      value: snsTopic.topicArn,
      exportName: snsTopicArnExportName
    })
  }
}
