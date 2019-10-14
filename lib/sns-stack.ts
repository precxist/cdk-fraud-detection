import cdk = require('@aws-cdk/core');
import sns = require('@aws-cdk/aws-sns');

export class SNSStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // topic
    const snsTopic = new sns.Topic(this, "fraudDetectionTopic");

    // email subscription
    const emailSub = new sns.Subscription(this, "fraudDetEmailSub", {
      endpoint: "minjkang@amazon.com",
      protocol: sns.SubscriptionProtocol.EMAIL,
      topic: snsTopic
    });

    // sms subscription
    const smsSub = new sns.Subscription(this, "fraudDetSMSSub", {
      endpoint: "+8201097340065",
      protocol: sns.SubscriptionProtocol.SMS,
      topic: snsTopic
    })

    const snsTopicArnExportName = "sns-topic-ARN"
    // Please note that the exportName could be referenced by any other external stacks
    // So exportName should be unique globally
    new cdk.CfnOutput(this, snsTopicArnExportName, {
      value: snsTopic.topicArn,
      exportName: snsTopicArnExportName
    })
  }
}
