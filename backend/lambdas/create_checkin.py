import json
import os
import uuid
from datetime import datetime, timezone

import boto3

dynamodb = boto3.resource('dynamodb')
checkins_table = dynamodb.Table(os.environ['CHECKINS_TABLE'])
caregivers_table = dynamodb.Table(os.environ['CAREGIVERS_TABLE'])

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
}


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body') or '{}')
        caregiver_id = (body.get('caregiverId') or '').strip()

        if not caregiver_id:
            return _response(400, {'error': 'caregiverId is required'})

        if not body.get('selfRecordingKey'):
            return _response(400, {'error': 'selfRecordingKey is required'})

        check_in_id = body.get('checkInId') or str(uuid.uuid4())
        submitted_at = datetime.now(timezone.utc).isoformat()

        item = {
            'caregiverId': caregiver_id,
            'submittedAt': submitted_at,
            'checkInId': check_in_id,
            'emotions': body.get('emotions') or [],
            'stressLevel': body.get('stressLevel'),
            'symptoms': body.get('symptoms') or [],
            'symptomsSkipped': bool(body.get('symptomsSkipped')),
            'selfRecordingKey': body['selfRecordingKey'],
            'selfRecordingDurationSeconds': body.get('selfRecordingDurationSeconds'),
        }

        if body.get('recipientRecordingKey'):
            item['recipientRecordingKey'] = body['recipientRecordingKey']
            item['recipientRecordingDurationSeconds'] = body.get('recipientRecordingDurationSeconds')

        checkins_table.put_item(Item=item)

        # Server-authoritative count, replacing the app's earlier local
        # increment placeholder now that a real backend exists. Also stamps
        # lastSubmittedAt on the caregiver record so the admin progress
        # portal can show "last active" without scanning CheckIns per row.
        updated = caregivers_table.update_item(
            Key={'caregiverId': caregiver_id},
            UpdateExpression='ADD completedEntryCount :one SET lastSubmittedAt = :now',
            ExpressionAttributeValues={':one': 1, ':now': submitted_at},
            ReturnValues='UPDATED_NEW',
        )

        return _response(200, {
            'checkInId': check_in_id,
            'completedEntryCount': int(updated['Attributes']['completedEntryCount']),
        })
    except Exception as exc:  # noqa: BLE001
        print(f'create_checkin error: {exc}')
        return _response(500, {'error': 'Internal server error'})


def _response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body),
    }
