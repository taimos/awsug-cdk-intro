import { Stack, Construct, Duration, Fn } from '@aws-cdk/core';
import { GatewayVpcEndpointAwsService, Vpc, InstanceType, InstanceClass, InstanceSize, IVpc } from '@aws-cdk/aws-ec2';
import { DatabaseInstance, DatabaseInstanceEngine } from '@aws-cdk/aws-rds';
import { LoadBalancedFargateService } from '@aws-cdk/aws-ecs-patterns';
import { ContainerImage } from '@aws-cdk/aws-ecs';
import { DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager';
import { HostedZone } from '@aws-cdk/aws-route53';

export class RDSStack extends Stack {
  public readonly vpc: IVpc;
  public readonly rds: DatabaseInstance;

  constructor(scope: Construct, id: string) {
    super(scope, id, { stackName: 'demo-rds' });
    this.templateOptions.description = 'RDS stack';

    this.vpc = new Vpc(this, 'VPC', {
      cidr: '10.0.0.0/16',
      gatewayEndpoints: {
        s3: { service: GatewayVpcEndpointAwsService.S3 }
      },
      natGateways: 1,
      maxAzs: 3,
    });

    this.rds = new DatabaseInstance(this, 'Database', {
      vpc: this.vpc,
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
    });

  }
}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, db: RDSStack) {
    super(scope, id, { stackName: 'demo-app' });
    this.templateOptions.description = 'App stack';

    const domainZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: 'ZoneID',
      zoneName: 'example.com',
    });

    const domainName = 'api.example.com';

    const certificate = new DnsValidatedCertificate(this, 'Certificate', {
      hostedZone: domainZone,
      domainName,
    });

    const loadBalancedFargateService = new LoadBalancedFargateService(this, 'Service', {
      vpc: db.vpc,
      memoryLimitMiB: 512,
      cpu: 256,
      publicTasks: true,
      // image: ContainerImage.fromRegistry('somerepo'),
      image: ContainerImage.fromAsset('./backendapp'),
      containerPort: 8080,
      certificate,
      domainName,
      domainZone,
      environment: {
        RDS_HOST: db.rds.dbInstanceEndpointAddress,
        RDS_PORT: db.rds.dbInstanceEndpointPort,
        RDS_USER: 'admin',
        RDS_PASSWORD: db.rds.secret ? db.rds.secret.secretValueFromJson('password').toString() : '',
      }
    });
    loadBalancedFargateService.service.connections.allowToDefaultPort(db.rds);
  }
}