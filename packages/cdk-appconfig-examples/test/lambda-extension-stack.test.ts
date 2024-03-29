import { anything, expect as expectCDK, haveResource, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from 'aws-cdk-lib';
import { LambdaExtensionStack } from '../lib';

describe('LambdaExtensionStack', () => {
  const app = new cdk.App();
  const stack = new LambdaExtensionStack(app, 'MyLambdaExtensionExample');

  it('has an AppConfig Application', () => {
    expectCDK(stack).to(haveResource('AWS::AppConfig::Application'));
  });

  it('has an AppConfig Environment', () => {
    expectCDK(stack).to(haveResource('AWS::AppConfig::Environment'));
  });

  it('has an AppConfig Configuration Profile', () => {
    expectCDK(stack).to(haveResource('AWS::AppConfig::ConfigurationProfile'));
  });

  it('has a lambda function with AppConfig lambda extension', () => {
    expectCDK(stack).to(
      haveResource('AWS::Lambda::Function', {
        Layers: [
          {
            'Fn::FindInMap': [
              'LambdaExtensionMap',
              {
                Ref: 'AWS::Region'
              },
              'arn'
            ]
          }
        ]
      })
    );
  });

  it('has a policy granting access to get configurations from app config', () => {
    expectCDK(stack).to(
      haveResourceLike('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 'appconfig:GetConfiguration'
            }
          ]
        }
      })
    );
  });

  it('has an alarm that triggers on lambda errors', () => {
    expectCDK(stack).to(
      haveResource('AWS::CloudWatch::Alarm', {
        Namespace: 'AWS/Lambda',
        MetricName: 'Errors',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: {
              Ref: anything()
            }
          }
        ]
      })
    );
  });
});
