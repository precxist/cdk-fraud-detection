import os
import time
import json

import boto3


ENDPOINT_NAME = os.environ['ENDPOINT_NAME']


def predict(rows):
    runtime= boto3.client('runtime.sagemaker')
    rows = "\n".join(rows)
    
    response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                       ContentType='text/csv',
                                       Body=rows)
                       
    fraud_score = response['Body'].read().decode()
    
    return fraud_score