import { Stack, Construct, Duration, RemovalPolicy } from '@aws-cdk/core';
import { GatewayVpcEndpointAwsService, Vpc, InstanceType, InstanceClass, InstanceSize } from '@aws-cdk/aws-ec2';
import { DatabaseInstance, DatabaseInstanceEngine } from '@aws-cdk/aws-rds';

class RDSStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id, { stackName: 'demo-rds' });
    this.templateOptions.description = 'RDS stack';

    const vpc = new Vpc(this, 'VPC', {
      cidr: '10.0.0.0/16',
      gatewayEndpoints: {
        s3: { service: GatewayVpcEndpointAwsService.S3 }
      },
      natGateways: 1,
      maxAzs: 3,
    });

    const rds = new DatabaseInstance(this, 'Database', {
      vpc,
      allocatedStorage: 10,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(7),
      databaseName: 'demo',
      deleteAutomatedBackups: true,
      engine: DatabaseInstanceEngine.POSTGRES,
      engineVersion: '11.4',
      instanceClass: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
      masterUsername: 'admin',
      multiAz: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

  }
}
