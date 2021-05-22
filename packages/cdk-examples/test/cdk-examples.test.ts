import { expect as expectCDK, matchTemplate, MatchStyle, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkExamples from '../lib/cdk-examples-stack';

describe('CdkExamplesStack', () => {
  it('has an AppConfig Application', () => {
    const app = new cdk.App();
    const stack = new CdkExamples.CdkExamplesStack(app, 'MyTestStack');

    expectCDK(stack).to(haveResource('AWS::AppConfig::Application'));
  });
});
