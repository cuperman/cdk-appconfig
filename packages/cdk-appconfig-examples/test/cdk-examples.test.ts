import { expect as expectCDK, matchTemplate, MatchStyle, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkExamples from '../lib/cdk-examples-stack';

describe('CdkExamplesStack', () => {
  const app = new cdk.App();
  const stack = new CdkExamples.CdkExamplesStack(app, 'MyTestStack');

  it('has an AppConfig Application', () => {
    expectCDK(stack).to(haveResource('AWS::AppConfig::Application'));
  });

  it('has a hosted configuration version', () => {
    expectCDK(stack).to(haveResource('Custom::HostedConfigurationVersion'));
  });
});
