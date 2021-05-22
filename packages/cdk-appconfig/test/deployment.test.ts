import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as appconfig from '../lib';

describe('AppConfig', () => {
  describe('Deployment', () => {
    describe('with required props', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'MyStack');

      const application = new appconfig.Application(stack, 'MyApplication', {
        name: 'My Application'
      });

      const environment = new appconfig.Environment(stack, 'MyEnvironment', {
        application,
        name: 'My Environment'
      });

      const configurationProfile = new appconfig.HostedConfigurationProfile(stack, 'MyConfigurationProfile', {
        application,
        name: 'My Configuration Profile'
      });

      const deploymentStrategy = new appconfig.DeploymentStrategy(stack, 'MyDeploymentStrategy', {
        name: 'My Deployment Strategy'
      });

      new appconfig.Deployment(stack, 'MyDeployment', {
        application,
        environment,
        configurationProfile,
        configurationVersionNumber: '1',
        deploymentStrategy
      });

      it('does something', () => {
        expectCDK(stack).to(haveResource('AWS::AppConfig::Deployment'));
      });
    });
  });
});
