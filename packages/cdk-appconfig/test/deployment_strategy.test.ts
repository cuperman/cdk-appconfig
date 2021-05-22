import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as appconfig from '../lib';

describe('AppConfig', () => {
  describe('DeploymentStrategy', () => {
    describe('with required props', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'MyStack');

      new appconfig.DeploymentStrategy(stack, 'MyDeploymentStrategy', {
        name: 'My Deployment Strategy'
      });

      it('does something', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::DeploymentStrategy', {
            Name: 'My Deployment Strategy'
          })
        );
      });
    });
  });
});
