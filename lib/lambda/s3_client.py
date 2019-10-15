import os
import time
import json

import boto3


SCORE_BUCKET_NAME = os.environ['SCORE_BUCKET_NAME']


def save_result_to_s3(transaction_list):
    s3 = boto3.resource("s3")
    score_bucket = s3.Bucket(SCORE_BUCKET_NAME)
    ts = str(int(time.time() * 1e7))
    result_file_name = ts + ".json"

    json_str = "\n".join(json.dumps(row) for row in transaction_list)
    score_bucket.put_object(Key=result_file_name, Body=json_str)

    
    