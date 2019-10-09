import os

import boto3

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def publish_fraud_msg(fraud_list):

    if len(fraud_list) > 0:
        sns = boto3.client('sns', region_name='ap-northeast-1')
        msg_body = \
            "Fraud Detected for those transactions: %s" % (", ".join(fraud_list))

        response = sns.publish(
            TopicArn=SNS_TOPIC_ARN,    
            Message=msg_body,    
        )
