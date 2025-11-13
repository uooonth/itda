import boto3
import os
from botocore.client import Config

s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),
    config=Config(signature_version="s3v4") 
)

BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")
