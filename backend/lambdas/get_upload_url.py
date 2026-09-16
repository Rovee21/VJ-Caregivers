import json
import os

import boto3
from botocore.client import Config

# The bucket uses SSE-KMS encryption, which AWS requires Signature Version 4
# for — boto3's default S3 client can otherwise generate presigned URLs with
# the older SigV2, which KMS-encrypted buckets reject.
s3 = boto3.client('s3', config=Config(signature_version='s3v4'))
BUCKET = os.environ['RECORDINGS_BUCKET']

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
}

VALID_TYPES = {'self', 'recipient'}
UPLOAD_URL_TTL_SECONDS = 300


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body') or '{}')
        caregiver_id = (body.get('caregiverId') or '').strip()
        check_in_id = (body.get('checkInId') or '').strip()
        recording_type = (body.get('recordingType') or '').strip().lower()

        if not caregiver_id or not check_in_id:
            return _response(400, {'error': 'caregiverId and checkInId are required'})

        if recording_type not in VALID_TYPES:
            return _response(400, {'error': f'recordingType must be one of {sorted(VALID_TYPES)}'})

        # One prefix per check-in so both recordings (self + recipient) land
        # together, addressable from the CheckIns record that references them.
        # Deliberately not passing ContentType here: doing so forces the
        # client's actual PUT request to send that exact Content-Type header
        # for the signature to validate, and React Native's fetch silently
        # overrides an explicitly-set Content-Type on a Blob body with the
        # Blob's own internal type — which doesn't match, causing a
        # SignatureDoesNotMatch. Leaving it unsigned means whatever the
        # client actually sends doesn't affect the signature at all.
        key = f'caregivers/{caregiver_id}/{check_in_id}/{recording_type}.mp4'
        upload_url = s3.generate_presigned_url(
            'put_object',
            Params={'Bucket': BUCKET, 'Key': key},
            ExpiresIn=UPLOAD_URL_TTL_SECONDS,
        )

        return _response(200, {'uploadUrl': upload_url, 's3Key': key})
    except Exception as exc:  # noqa: BLE001
        print(f'get_upload_url error: {exc}')
        return _response(500, {'error': 'Internal server error'})


def _response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body),
    }
