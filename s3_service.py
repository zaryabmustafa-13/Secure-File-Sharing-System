import os
import boto3
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION")
)

BUCKET = os.getenv("S3_BUCKET_NAME")


def upload_encrypted_file(file, key):
    s3.upload_fileobj(
        file,
        BUCKET,
        key,
        ExtraArgs={
            "ContentType": "application/octet-stream"
        }
    )


def download_encrypted_file(key):
    response = s3.get_object(
        Bucket=BUCKET,
        Key=key
    )
    return response["Body"].read()


def generate_upload_url(object_key):
    return s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": BUCKET,
            "Key": object_key,
            "ContentType": "application/octet-stream"
        },
        ExpiresIn=300
    )


def generate_download_url(object_key):
    return s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": BUCKET,
            "Key": object_key
        },
        ExpiresIn=300
    )