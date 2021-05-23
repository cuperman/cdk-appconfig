import { anything, expect as expectCDK, haveResource } from '@aws-cdk/assert';
import {
  buildCdkStack,
  buildApplication,
  buildHostedProfile,
  buildEnvironment,
  buildDeploymentStrategy
} from './helpers';
import * as appconfig from '../lib';

describe('AppConfig', () => {
  describe('Deployment', () => {
    describe('with required props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack);
      const configurationProfile = buildHostedProfile(stack, { application });
      const environment = buildEnvironment(stack, { application });
      const deploymentStrategy = buildDeploymentStrategy(stack);

      new appconfig.Deployment(stack, 'MyDeployment', {
        application,
        configurationProfile,
        configurationVersionNumber: '1',
        environment,
        deploymentStrategy
      });

      it('creates a deployment with required properties', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::Deployment', {
            ApplicationId: {
              Ref: anything()
            },
            ConfigurationProfileId: {
              Ref: anything()
            },
            ConfigurationVersion: '1',
            EnvironmentId: {
              Ref: anything()
            },
            DeploymentStrategyId: {
              Ref: anything()
            }
          })
        );
      });
    });

    describe('with optional props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack);
      const configurationProfile = buildHostedProfile(stack, { application });
      const environment = buildEnvironment(stack, { application });
      const deploymentStrategy = buildDeploymentStrategy(stack);

      new appconfig.Deployment(stack, 'MyDeployment', {
        application,
        configurationProfile,
        configurationVersionNumber: '1',
        environment,
        deploymentStrategy,
        description: 'My first deployment'
      });

      it('creates a deployment with optional properties', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::Deployment', {
            Description: 'My first deployment'
          })
        );
      });
    });

    describe('with tags', () => {
      const stack = buildCdkStack({ tags: { Foo: 'Bar', Kanye: 'West' } });
      const application = buildApplication(stack);
      const configurationProfile = buildHostedProfile(stack, { application });
      const environment = buildEnvironment(stack, { application });
      const deploymentStrategy = buildDeploymentStrategy(stack);

      new appconfig.Deployment(stack, 'MyDeployment', {
        application,
        configurationProfile,
        configurationVersionNumber: '1',
        environment,
        deploymentStrategy
      });

      it('applies tags', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::Deployment', {
            Tags: [
              { Key: 'Foo', Value: 'Bar' },
              { Key: 'Kanye', Value: 'West' }
            ]
          })
        );
      });
    });
  });
});
