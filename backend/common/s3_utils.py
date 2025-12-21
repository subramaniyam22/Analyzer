import boto3
import os
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=os.getenv("MINIO_URL"),
            aws_access_key_id=os.getenv("MINIO_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("MINIO_SECRET_KEY"),
            region_name='us-east-1'
        )
        self.bucket = os.getenv("MINIO_BUCKET_NAME")

    def upload_file(self, file_path, object_name=None):
        if object_name is None:
            object_name = os.path.basename(file_path)

        try:
            self.s3_client.upload_file(file_path, self.bucket, object_name)
        except ClientError as e:
            print(f"Error uploading file: {e}")
            return False
        return True

    def upload_fileobj(self, fileobj, object_name):
        try:
            self.s3_client.upload_fileobj(fileobj, self.bucket, object_name)
        except ClientError as e:
            print(f"Error uploading file object: {e}")
            return False
        return True

    def get_download_url(self, object_name, expiration=3600):
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': object_name},
                ExpiresIn=expiration
            )
        except ClientError as e:
            print(f"Error generating url: {e}")
            return None
        return response

    def create_bucket_if_not_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket)
        except ClientError:
            self.s3_client.create_bucket(Bucket=self.bucket)
