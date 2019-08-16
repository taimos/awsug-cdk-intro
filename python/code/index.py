import boto3

sts = boto3.client('sts')

def lambda_handler(event, context):
    caller = sts.get_caller_identity()['Arn']
    print(f'I am currently {caller}')