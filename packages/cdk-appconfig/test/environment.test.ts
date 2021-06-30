import {
  expect as expectCDK,
  haveResource,
  haveResourceLike,
  anything,
  ResourcePart,
  countResources
} from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';

import { buildCdkStack, buildApplication, buildAlarm, buildHostedProfile, buildDeploymentStrategy } from './helpers';
import { Environment } from '../lib';

describe('AppConfig', () => {
  describe('Environment', () => {
    describe('with required props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack, 'MyApplication');

      const environment = new Environment(stack, 'MyEnvironment', {
        application
      });

      it('has an environment id', () => {
        expect(typeof environment.environmentId).toEqual('string');
      });

      it('has an environment name', () => {
        expect(typeof environment.environmentName).toEqual('string');
      });

      it('has an environment arn', () => {
        expect(typeof environment.environmentArn).toEqual('string');
      });

      it('creates an environment resource with required properties', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::Environment', {
            ApplicationId: {
              Ref: anything()
            },
            Name: anything()
          })
        );
      });

      it('deletes environments by default because no resources depend on them by default', () => {
        expectCDK(stack).to(
          haveResource(
            'AWS::AppConfig::Environment',
            {
              UpdateReplacePolicy: 'Delete',
              DeletionPolicy: 'Delete'
            },
            ResourcePart.CompleteDefinition
          )
        );
      });

      it('does not have an alarm role', () => {
        expectCDK(stack).notTo(haveResourceLike('AWS::IAM::Role'));
      });
    });

    describe('with optional props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack, 'MyApplication');

      const alarm = buildAlarm(stack);

      const environment = new Environment(stack, 'MyEnvironment', {
        application,
        name: 'MyEnv',
        description: 'My environment',
        alarms: [alarm],
        removalPolicy: cdk.RemovalPolicy.RETAIN
      });

      it('has a specific environment name', () => {
        expect(environment.environmentName).toEqual('MyEnv');
      });

      it('creates an alarm role', () => {
        expectCDK(stack).to(
          haveResourceLike('AWS::IAM::Role', {
            AssumeRolePolicyDocument: {
              Statement: [
                {
                  Principal: {
                    Service: 'appconfig.amazonaws.com'
                  }
                }
              ]
            },
            Policies: [
              {
                PolicyName: 'SSMCloudWatchAlarmDiscoveryRole',
                PolicyDocument: {
                  Statement: [
                    {
                      Effect: 'Allow',
                      Action: 'cloudwatch:DescribeAlarms',
                      Resource: '*'
                    }
                  ]
                }
              }
            ]
          })
        );
      });

      it('creates an environment resource with optional properties', () => {
        expectCDK(stack).to(
          haveResource(
            'AWS::AppConfig::Environment',
            {
              Properties: {
                ApplicationId: {
                  Ref: anything()
                },
                Name: 'MyEnv',
                Description: 'My environment',
                Monitors: [
                  {
                    AlarmArn: anything(),
                    AlarmRoleArn: anything()
                  }
                ]
              },
              UpdateReplacePolicy: 'Retain',
              DeletionPolicy: 'Retain'
            },
            ResourcePart.CompleteDefinition
          )
        );
      });
    });

    describe('with tags', () => {
      const stack = buildCdkStack({ tags: { Foo: 'Bar', Kanye: 'West' } });
      const application = buildApplication(stack, 'MyApplication');

      new Environment(stack, 'MyEnvironment', {
        application
      });

      it('applies tags', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::Environment', {
            Tags: [
              { Key: 'Foo', Value: 'Bar' },
              { Key: 'Kanye', Value: 'West' }
            ]
          })
        );
      });
    });

    describe('addAlarm', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack, 'MyApplication');

      const environment = new Environment(stack, 'MyEnvironment', {
        application
      });

      const fn = new lambda.Function(stack, 'MyLambda', {
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromInline(`
          exports.handler = async () => {
            return 'Hello, World!';
          };
        `),
        handler: 'index.handler'
      });

      environment.addAlarm(
        new cloudwatch.Alarm(stack, 'MyAlarm', {
          metric: fn.metricErrors(),
          threshold: 1,
          evaluationPeriods: 1
        })
      );

      it('adds a monitor to the environment resource', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::Environment', {
            Monitors: [
              {
                AlarmArn: anything(),
                AlarmRoleArn: anything()
              }
            ]
          })
        );
      });
    });

    describe('addDeployment', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack, 'MyApplication');
      const profile = buildHostedProfile(stack, {
        application
      });
      const strategy = buildDeploymentStrategy(stack);

      const environment = new Environment(stack, 'MyEnvironment', {
        application
      });

      environment.addDeployment({
        configurationProfile: profile,
        configurationVersionNumber: '1',
        deploymentStrategy: strategy
      });

      it('creates a deployment', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::Deployment', {
            ConfigurationVersion: '1'
          })
        );
      });

      it('creates a dependency on any previous deployments', () => {
        environment.addDeployment({
          configurationProfile: profile,
          configurationVersionNumber: '2',
          deploymentStrategy: strategy
        });

        expectCDK(stack).to(countResources('AWS::AppConfig::Deployment', 2));
        expectCDK(stack).to(
          haveResource(
            'AWS::AppConfig::Deployment',
            {
              DependsOn: [anything()]
            },
            ResourcePart.CompleteDefinition
          )
        );
      });
    });
  });
});
