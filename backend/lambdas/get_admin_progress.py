import json
import os

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
caregivers_table = dynamodb.Table(os.environ['CAREGIVERS_TABLE'])
checkins_table = dynamodb.Table(os.environ['CHECKINS_TABLE'])

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET',
}

def lambda_handler(event, context):
    try:
        caregivers = _scan_all(caregivers_table)
        rows = [_progress_row(caregiver) for caregiver in caregivers]

        # Most recently active first; caregivers with no check-ins yet sort last.
        rows.sort(key=lambda row: row['lastSubmittedAt'] or '', reverse=True)

        return _response(200, rows)
    except Exception as exc:  # noqa: BLE001
        print(f'get_admin_progress error: {exc}')
        return _response(500, {'error': 'Internal server error'})


def _progress_row(caregiver):
    latest = _latest_checkin(caregiver['caregiverId']) or {}
    stress = latest.get('stressLevel')

    return {
        'caregiverFirstName': caregiver.get('caregiverFirstName'),
        'recipientName': caregiver.get('recipientName'),
        'recipientCondition': caregiver.get('recipientCondition'),
        'lastSubmittedAt': latest.get('submittedAt'),
        'emotions': latest.get('emotions') or [],
        'stressLevel': int(stress) if stress is not None else None,
        'symptoms': latest.get('symptoms') or [],
        'symptomsSkipped': bool(latest.get('symptomsSkipped')),
    }


def _latest_checkin(caregiver_id):
    response = checkins_table.query(
        KeyConditionExpression=Key('caregiverId').eq(caregiver_id),
        ScanIndexForward=False,
        Limit=1,
    )
    items = response['Items']
    return items[0] if items else None


def _scan_all(table):
    items = []
    response = table.scan()
    items.extend(response['Items'])

    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response['Items'])

    return items


def _response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body),
    }
