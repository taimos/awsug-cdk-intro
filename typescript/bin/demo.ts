import cdk = require('@aws-cdk/core');
import { DemoStack } from '../lib/demo-stack';
import { RDSStack, AppStack } from '../lib/app';
import { FrontendStack } from '../lib/web';
import { LambdaStack } from '../lib/api';

const app = new cdk.App();
new DemoStack(app, 'DemoStack');

const rds = new RDSStack(app, 'RDSStack');
new AppStack(app, 'AppStack', rds);

new FrontendStack(app, 'Frontend');
new LambdaStack(app);