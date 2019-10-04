from __future__ import print_function

import base64
import json

import sagemaker_client
import sns_client


def handler(event, context):
    pred_rows = []
    transaction_list = []
    
    for record in event['Records']:
        payload = json.loads(base64.b64decode(record['kinesis']['data']))
        pred_rows.append(payload["row"])
        transaction_list.append(payload)
    
    pred_scores = sagemaker_client.predict(pred_rows).split(",")
    num_rows = len(pred_rows)
    
    for i in range(num_rows):
        fraud_score = float(pred_scores[i])
        is_fraud = fraud_score >= 0.5
        transaction_list[i].update({
            "score": fraud_score,
            "is_fraud": int(is_fraud)
        })
        
        if is_fraud:
            sns_client.publish_fraud_msg(transaction_list[i]["transaction_id"])
    
    return "Success"
