import { expect as expectCDK, haveResource, anything, ResourcePart, haveResourceLike, Capture } from '@aws-cdk/assert';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';

import { buildCdkStack, buildApplication, buildEnvironment } from './helpers';
import {
  ConfigurationProfile,
  HostedConfigurationProfile,
  S3ConfigurationProfile,
  JsonSchemaValidator,
  LambdaValidator
} from '../lib';

describe('AppConfig', () => {
  describe('ConfigurationProfile', () => {
    describe('constructor', () => {
      describe('with required props', () => {
        const stack = buildCdkStack();
        const application = buildApplication(stack, 'MyApplication');

        const profile = new ConfigurationProfile(stack, 'MyProfile', {
          application,
          locationUri: 'hosted'
        });

        it('has a configuration profile id', () => {
          expect(typeof profile.configurationProfileId).toEqual('string');
        });

        it('has a configuration profile name', () => {
          expect(typeof profile.configurationProfileName).toEqual('string');
        });

        it('has a configuration profile arn', () => {
          expect(typeof profile.configurationProfileArn).toEqual('string');
        });

        it('creates a configuration profile resource with required properties', () => {
          expectCDK(stack).to(
            haveResource('AWS::AppConfig::ConfigurationProfile', {
              ApplicationId: {
                Ref: anything()
              },
              Name: anything(),
              LocationUri: 'hosted'
            })
          );
        });

        it("can't delete profiles because of nested configuration versions", () => {
          expectCDK(stack).to(
            haveResource(
              'AWS::AppConfig::ConfigurationProfile',
              {
                UpdateReplacePolicy: 'Retain',
                DeletionPolicy: 'Retain'
              },
              ResourcePart.CompleteDefinition
            )
          );
        });
      });

      describe('with optional props', () => {
        const stack = buildCdkStack();
        const application = buildApplication(stack, 'MyApplication');

        const profile = new ConfigurationProfile(stack, 'MyProfile', {
          application,
          name: 'MyProfile',
          locationUri: 'hosted',
          description: 'My configuration profile',
          removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        it('has a specific configuration profile name', () => {
          expect(profile.configurationProfileName).toEqual('MyProfile');
        });

        it('creates a configuration profile resource with optional properties', () => {
          expectCDK(stack).to(
            haveResource(
              'AWS::AppConfig::ConfigurationProfile',
              {
                Properties: {
                  ApplicationId: {
                    Ref: anything()
                  },
                  Name: 'MyProfile',
                  LocationUri: 'hosted',
                  Description: 'My configuration profile'
                },
                UpdateReplacePolicy: 'Delete',
                DeletionPolicy: 'Delete'
              },
              ResourcePart.CompleteDefinition
            )
          );
        });
      });

      describe('with tags', () => {
        const stack = buildCdkStack({ tags: { Foo: 'Bar', Kanye: 'West' } });
        const application = buildApplication(stack, 'MyApplication');

        new ConfigurationProfile(stack, 'MyProfile', {
          application,
          name: 'MyProfile',
          locationUri: 'hosted'
        });

        it('applies tags', () => {
          expectCDK(stack).to(
            haveResource('AWS::AppConfig::ConfigurationProfile', {
              Tags: [
                { Key: 'Foo', Value: 'Bar' },
                { Key: 'Kanye', Value: 'West' }
              ]
            })
          );
        });
      });

      describe('with inline json schema validator', () => {
        const stack = buildCdkStack();
        const application = buildApplication(stack, 'MyApplication');

        new ConfigurationProfile(stack, 'MyProfile', {
          application,
          name: 'MyProfile',
          locationUri: 'hosted',
          validators: [
            JsonSchemaValidator.fromInline(
              '{"$schema": "http://json-schema.org/draft/2019-09/schema#","type":"object"}'
            )
          ]
        });

        it('includes validator configurations', () => {
          expectCDK(stack).to(
            haveResource('AWS::AppConfig::ConfigurationProfile', {
              Name: 'MyProfile',
              Validators: [
                {
                  Type: 'JSON_SCHEMA',
                  Content: '{"$schema": "http://json-schema.org/draft/2019-09/schema#","type":"object"}'
                }
              ]
            })
          );
        });
      });

      describe('with lambda validator', () => {
        const stack = buildCdkStack();
        const application = buildApplication(stack, 'MyApplication');
        const lambdaFunction = lambda.Function.fromFunctionArn(
          stack,
          'MyLambda',
          'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        );

        new ConfigurationProfile(stack, 'MyProfile', {
          application,
          name: 'MyProfile',
          locationUri: 'hosted',
          validators: [LambdaValidator.fromLambdaFunction(lambdaFunction)]
        });

        it('includes validator configurations', () => {
          expectCDK(stack).to(
            haveResource('AWS::AppConfig::ConfigurationProfile', {
              Name: 'MyProfile',
              Validators: [
                {
                  Type: 'LAMBDA',
                  Content: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
                }
              ]
            })
          );
        });
      });
    });

    describe('grantGetConfiguration', () => {
      describe('with required arguments', () => {
        const stack = buildCdkStack();
        const app = buildApplication(stack, 'MyApplication');

        const config = new HostedConfigurationProfile(stack, 'MyConfig', {
          application: app
        });

        const fn = new lambda.Function(stack, 'MyFunction', {
          runtime: lambda.Runtime.NODEJS_12_X,
          code: lambda.Code.fromInline(`
              exports.handler = async () => {
                return 'Hello, World!'
              };
            `),
          handler: 'index.handler'
        });

        config.grantGetConfiguration(fn);

        it('allows GetConfigration action for parent application, this configuration profile, and all environments', () => {
          const applicationArn = Capture.anyType();
          const environmentArn = Capture.anyType();
          const configurationArn = Capture.anyType();

          expectCDK(stack).to(
            haveResourceLike('AWS::IAM::Policy', {
              PolicyDocument: {
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: 'appconfig:GetConfiguration',
                    Resource: [applicationArn.capture(), environmentArn.capture(), configurationArn.capture()]
                  }
                ]
              }
            })
          );

          expect(JSON.stringify(applicationArn.capturedValue)).toContain('application/",{"Ref":"MyApplication');
          expect(JSON.stringify(configurationArn.capturedValue)).toContain('configurationprofile/",{"Ref":"MyConfig');
          expect(JSON.stringify(environmentArn.capturedValue)).toContain('environment/*');
        });
      });

      describe('with environment (optional argument)', () => {
        const stack = buildCdkStack();
        const app = buildApplication(stack, 'MyApplication');
        const env = buildEnvironment(stack, 'MyEnvironment', { application: app });

        const config = new HostedConfigurationProfile(stack, 'MyConfig', {
          application: app
        });

        const fn = new lambda.Function(stack, 'MyFunction', {
          runtime: lambda.Runtime.NODEJS_12_X,
          code: lambda.Code.fromInline(`
              exports.handler = async () => {
                return 'Hello, World!'
              };
            `),
          handler: 'index.handler'
        });

        config.grantGetConfiguration(fn, env);

        it('allows GetConfigration action for parent application, this configuration profile, and specified environment', () => {
          const applicationArn = Capture.anyType();
          const environmentArn = Capture.anyType();
          const configurationArn = Capture.anyType();

          expectCDK(stack).to(
            haveResourceLike('AWS::IAM::Policy', {
              PolicyDocument: {
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: 'appconfig:GetConfiguration',
                    Resource: [applicationArn.capture(), environmentArn.capture(), configurationArn.capture()]
                  }
                ]
              }
            })
          );

          expect(JSON.stringify(applicationArn.capturedValue)).toContain('application/",{"Ref":"MyApplication');
          expect(JSON.stringify(configurationArn.capturedValue)).toContain('configurationprofile/",{"Ref":"MyConfig');
          expect(JSON.stringify(environmentArn.capturedValue)).toContain('environment/",{"Ref":"MyEnvironment');
        });
      });
    });
  });

  describe('HostedConfigurationProfile', () => {
    const stack = buildCdkStack();
    const application = buildApplication(stack, 'MyApplication');

    new HostedConfigurationProfile(stack, 'MyProfile', {
      application,
      name: 'MyProfile'
    });

    it('sets the locationUri to "hosted"', () => {
      expectCDK(stack).to(
        haveResource('AWS::AppConfig::ConfigurationProfile', {
          LocationUri: 'hosted'
        })
      );
    });
  });

  describe('S3ConfigurationProfile', () => {
    const stack = buildCdkStack();
    const application = buildApplication(stack, 'MyApplication');

    const configBucket = s3.Bucket.fromBucketName(stack, 'ConfigBucket', 'my-config-bucket');

    new S3ConfigurationProfile(stack, 'MyProfile', {
      application,
      name: 'MyProfile',
      s3Bucket: configBucket,
      s3ObjectKey: 'path/to/config.yml'
    });

    it('sets the locationUri to "hosted"', () => {
      expectCDK(stack).to(
        haveResource('AWS::AppConfig::ConfigurationProfile', {
          LocationUri: 's3://my-config-bucket/path/to/config.yml'
        })
      );
    });
  });
});
