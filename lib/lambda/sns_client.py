import os

import boto3

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def publish_fraud_msg(transaction_id):
    sns = boto3.client('sns', region_name='ap-northeast-1')
    msg_body = "Fraud Detected: transaction_id %s" % (transaction_id)

    response = sns.publish(
        TopicArn=SNS_TOPIC_ARN,    
        Message=msg_body,    
    )
