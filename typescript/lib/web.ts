import { Stack, Construct, App, Duration } from '@aws-cdk/core';
import { SinglePageAppHosting } from 'taimos-cdk-constructs';

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id, { stackName: 'demo-frontend' });
    this.templateOptions.description = 'Frontend stack';

    new SinglePageAppHosting(this, 'Frontend', {
      zoneId: 'ZoneID',
      zoneName: 'example.com',
      webFolder: './frontend',
    });
  }
}
