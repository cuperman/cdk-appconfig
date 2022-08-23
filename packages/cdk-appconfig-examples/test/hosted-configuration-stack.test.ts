import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from 'aws-cdk-lib';
import { HostedConfigurationStack } from '../lib';

describe('HostedConfigurationStack', () => {
  const app = new cdk.App();
  const stack = new HostedConfigurationStack(app, 'MyHostedConfigExample');

  it('has an AppConfig Application', () => {
    expectCDK(stack).to(haveResource('AWS::AppConfig::Application'));
  });

  it('has a hosted configuration version', () => {
    expectCDK(stack).to(haveResource('Custom::HostedConfigurationVersion'));
  });
});
