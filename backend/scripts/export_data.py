#!/usr/bin/env python3
"""
Exports every caregiver + check-in record to an Excel spreadsheet, and
downloads every recording from S3 into a local folder (mirroring the
caregivers/{caregiverId}/{checkInId}/{self|recipient}.mp4 layout).

Run locally with an AWS user/role that can dynamodb:Scan the two tables and
s3:ListBucket/GetObject the recordings bucket (separate from the Lambdas'
own restricted execution role in backend/iam/lambda-execution-policy.json).

Setup:
    pip install -r requirements.txt
    aws configure                # one-time, if not already done

Usage:
    CAREGIVERS_TABLE=VoiceJournalCaregivers-Caregivers \
    CHECKINS_TABLE=VoiceJournalCaregivers-CheckIns \
    RECORDINGS_BUCKET=your-bucket-name \
    python3 export_data.py [output_dir]

Safe to re-run: the spreadsheet is fully regenerated each time, and
recording downloads skip files already present locally with a matching size.
"""
import os
import sys
from pathlib import Path

import boto3
from openpyxl import Workbook


def scan_table(table):
    items = []
    response = table.scan()
    items.extend(response['Items'])

    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response['Items'])

    return items


def stringify(value):
    if isinstance(value, list):
        return ', '.join(str(v) for v in value)
    if value is None:
        return ''
    return str(value)


def write_sheet(workbook, title, rows):
    sheet = workbook.create_sheet(title)

    if not rows:
        return

    # Union of keys across all rows, since not every check-in has e.g.
    # recipientRecordingKey — keeps the header stable instead of per-row.
    headers = sorted({key for row in rows for key in row.keys()})
    sheet.append(headers)

    for row in rows:
        sheet.append([stringify(row.get(header)) for header in headers])


def download_recordings(s3, bucket, dest_dir):
    paginator = s3.get_paginator('list_objects_v2')
    downloaded = 0

    for page in paginator.paginate(Bucket=bucket, Prefix='caregivers/'):
        for obj in page.get('Contents', []):
            key = obj['Key']
            local_path = dest_dir / key
            local_path.parent.mkdir(parents=True, exist_ok=True)

            if local_path.exists() and local_path.stat().st_size == obj['Size']:
                continue

            s3.download_file(bucket, key, str(local_path))
            downloaded += 1

    return downloaded


def main():
    caregivers_table_name = os.environ['CAREGIVERS_TABLE']
    checkins_table_name = os.environ['CHECKINS_TABLE']
    bucket = os.environ['RECORDINGS_BUCKET']
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('export')
    out_dir.mkdir(parents=True, exist_ok=True)

    dynamodb = boto3.resource('dynamodb')
    caregivers = scan_table(dynamodb.Table(caregivers_table_name))
    checkins = scan_table(dynamodb.Table(checkins_table_name))

    workbook = Workbook()
    workbook.remove(workbook.active)
    write_sheet(workbook, 'Caregivers', caregivers)
    write_sheet(workbook, 'CheckIns', checkins)

    spreadsheet_path = out_dir / 'caregivers_export.xlsx'
    workbook.save(spreadsheet_path)
    print(f'Wrote {len(caregivers)} caregiver(s) and {len(checkins)} check-in(s) to {spreadsheet_path}')

    s3 = boto3.client('s3')
    recordings_dir = out_dir / 'recordings'
    downloaded = download_recordings(s3, bucket, recordings_dir)
    print(f'Downloaded {downloaded} new recording(s) to {recordings_dir}')


if __name__ == '__main__':
    main()
