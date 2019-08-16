import cdk = require('@aws-cdk/core');
import { CfnVPC } from '@aws-cdk/aws-ec2';

export class DemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
  }
}
