from __future__ import print_function

import base64
import json
import time

import sagemaker_client
import sns_client
import s3_client


def handler(event, context):
    start_at = time.time()
    pred_rows = []
    transaction_list = []
    
    for record in event['Records']:
        payload = json.loads(base64.b64decode(record['kinesis']['data']))
        pred_rows.append(payload["row"])
        transaction_list.append(payload)
    
    pred_scores = sagemaker_client.predict(pred_rows).split(",")
    num_rows = len(pred_rows)

    fraud_list = []
    
    for i in range(num_rows):
        fraud_score = float(pred_scores[i])
        if fraud_score >= 0.5:
            is_fraud = "Y"
        else:
            is_fraud = "N"
        transaction_list[i].update({
            "score": fraud_score,
            "is_fraud": is_fraud,
        })
        transaction_list[i].pop("row")
        
        if is_fraud:
            fraud_list.append(transaction_list[i]["transaction_id"])
    
    s3_client.save_result_to_s3(transaction_list)
    sns_client.publish_fraud_msg(fraud_list)

    print("%.4fsec elapsed for %d transactions" % (time.time() - start_at, num_rows))
    
    return "Success"
