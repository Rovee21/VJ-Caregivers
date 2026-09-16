import json
import os
import uuid
from datetime import datetime, timezone

import boto3

dynamodb = boto3.resource('dynamodb')
caregivers_table = dynamodb.Table(os.environ['CAREGIVERS_TABLE'])

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
}

VALID_CONDITIONS = {'dementia', 'cancer'}
DEFAULT_TARGET_ENTRY_COUNT = 12


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body') or '{}')
        caregiver_first_name = (body.get('caregiverFirstName') or '').strip()
        recipient_name = (body.get('recipientName') or '').strip()
        recipient_condition = (body.get('recipientCondition') or '').strip().lower()

        if not caregiver_first_name or not recipient_name:
            return _response(400, {'error': 'caregiverFirstName and recipientName are required'})

        if recipient_condition not in VALID_CONDITIONS:
            return _response(400, {'error': f'recipientCondition must be one of {sorted(VALID_CONDITIONS)}'})

        caregiver_id = str(uuid.uuid4())
        caregivers_table.put_item(Item={
            'caregiverId': caregiver_id,
            'caregiverFirstName': caregiver_first_name,
            'recipientName': recipient_name,
            'recipientCondition': recipient_condition,
            'completedEntryCount': 0,
            'targetEntryCount': DEFAULT_TARGET_ENTRY_COUNT,
            'createdAt': datetime.now(timezone.utc).isoformat(),
        })

        return _response(200, {
            'caregiverId': caregiver_id,
            'caregiverFirstName': caregiver_first_name,
            'recipientName': recipient_name,
            'recipientCondition': recipient_condition,
            'completedEntryCount': 0,
            'targetEntryCount': DEFAULT_TARGET_ENTRY_COUNT,
        })
    except Exception as exc:  # noqa: BLE001 - top-level Lambda handler boundary
        print(f'create_caregiver error: {exc}')
        return _response(500, {'error': 'Internal server error'})


def _response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body),
    }
