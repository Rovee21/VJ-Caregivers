import json
import os

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
checkins_table = dynamodb.Table(os.environ['CHECKINS_TABLE'])

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'OPTIONS,GET',
}


def lambda_handler(event, context):
    try:
        caregiver_id = (event.get('pathParameters') or {}).get('caregiverId')

        if not caregiver_id:
            return _response(400, {'error': 'caregiverId is required'})

        result = checkins_table.query(
            KeyConditionExpression=Key('caregiverId').eq(caregiver_id),
            ScanIndexForward=False,  # newest first
        )

        # Minimum-necessary response: history only needs emotions/stress for
        # the calendar view, not symptoms or recording locations.
        # DynamoDB always returns numbers as Decimal, which json.dumps can't
        # serialize — cast back to int before returning.
        entries = [
            {
                'id': entry['checkInId'],
                'submittedAt': entry['submittedAt'],
                'emotions': entry.get('emotions', []),
                'stressLevel': int(entry['stressLevel']) if entry.get('stressLevel') is not None else None,
            }
            for entry in result.get('Items', [])
        ]

        return _response(200, entries)
    except Exception as exc:  # noqa: BLE001
        print(f'get_checkin_history error: {exc}')
        return _response(500, {'error': 'Internal server error'})


def _response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body),
    }
