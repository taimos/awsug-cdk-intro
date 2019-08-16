import { App, Stack, Duration, Construct } from '@aws-cdk/core';
import { Function, Code, Runtime } from '@aws-cdk/aws-lambda';
import { RestApi, LambdaIntegration, EndpointType } from '@aws-cdk/aws-apigateway';
import { Table, BillingMode, AttributeType } from '@aws-cdk/aws-dynamodb';
import { DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager';
import { HostedZone, RecordTarget, ARecord } from '@aws-cdk/aws-route53';
import { ApiGatewayDomain } from '@aws-cdk/aws-route53-targets';

interface ApiFunctionProps {
    readonly methodName: string;
    readonly timeout?: Duration;
    readonly environment?: {
        [key: string]: any;
    };
}

class ApiFunction extends Function {
    private static codeAsset = Code.asset('./lib');
    
    readonly integration: LambdaIntegration;

    constructor(scope: Construct, props: ApiFunctionProps) {
        super(scope, `${props.methodName}Function`, {
            code: ApiFunction.codeAsset,
            handler: `dist/index.${props.methodName}`,
            runtime: Runtime.NODEJS_10_X,
            timeout: props.timeout || Duration.seconds(10),
            environment: props.environment,
        });
        this.integration = new LambdaIntegration(this);
    }
}

export class LambdaStack extends Stack {
    constructor(parent: App) {
        super(parent, 'demo-api');
        this.templateOptions.description = 'Demo API';

        const table = new Table(this, 'Table', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: { type: AttributeType.STRING, name: 'Id' },
        });

        const lambdaGetAllMessages = new ApiFunction(this, {
            methodName: 'getAllMessages',
            environment: {
                'TABLE_NAME_MESSAGETABLE': table.tableName,
            }
        });
        const lambdaDeleteMessage = new ApiFunction(this, {
            methodName: 'deleteMessage',
            environment: {
                'TABLE_NAME_MESSAGETABLE': table.tableName,
            }
        });

        table.grantReadData(lambdaGetAllMessages);
        table.grantReadWriteData(lambdaDeleteMessage);

        const api = this.createPublicApi();

        api.root.resourceForPath('/messages').addMethod('GET', lambdaGetAllMessages.integration);
        api.root.resourceForPath('/messages/{id}').addMethod('DELETE', lambdaDeleteMessage.integration);
    }

    private createPublicApi(): RestApi {
        const domainName = 'example.com';
        const hostedZone = HostedZone.fromLookup(this, 'PublicZone', { domainName });

        const publicCertificate = new DnsValidatedCertificate(this, 'PublicCert', {
            hostedZone,
            domainName: `api.${domainName}`,
            region: 'us-east-1',
        });

        const api = new RestApi(this, 'PushPlatform', {
            endpointTypes: [EndpointType.EDGE],
            domainName: {
                endpointType: EndpointType.EDGE,
                domainName: `api.${domainName}`,
                certificate: publicCertificate,
            }
        });
        if (api.domainName) {
            new ARecord(this, 'ExternalR53Alias', {
                recordName: 'api',
                zone: hostedZone,
                target: RecordTarget.fromAlias(new ApiGatewayDomain(api.domainName))
            });
        }
        return api;
    }
}
