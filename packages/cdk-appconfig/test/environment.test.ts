import { expect as expectCDK, haveResource, haveResourceLike, anything, ResourcePart } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';

import { buildCdkStack, buildApplication, buildAlarm } from './helpers';
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
    });

    describe('with optional props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack, 'MyApplication');

      const alarm = buildAlarm(stack);

      new Environment(stack, 'MyEnvironment', {
        application,
        name: 'MyEnv',
        description: 'My environment',
        alarms: [alarm],
        removalPolicy: cdk.RemovalPolicy.RETAIN
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
        application,
        name: 'MyEnv'
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
  });
});
