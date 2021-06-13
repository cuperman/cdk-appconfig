import * as path from 'path';

import { expect as expectCDK, haveResource, anything, ResourcePart, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';

import { buildCdkStack, buildApplication, buildHostedProfile } from './helpers';
import * as appconfig from '../lib';

describe('AppConfig', () => {
  describe('HostedConfigurationVersion', () => {
    describe('with required props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack, 'MyApplication');
      const profile = buildHostedProfile(stack, { application });

      const configVersion = new appconfig.HostedConfigurationVersion(stack, 'MyConfigVersion', {
        application,
        configurationProfile: profile,
        contentType: appconfig.ContentType.TEXT,
        content: appconfig.Content.fromInline('My configuration content')
      });

      it('has a version number', () => {
        expect(typeof configVersion.versionNumber).toEqual('string');
      });

      it('creates a hosted configuration version resource with required properties', () => {
        expectCDK(stack).to(
          haveResource('Custom::HostedConfigurationVersion', {
            ApplicationId: {
              Ref: anything()
            },
            ConfigurationProfileId: {
              Ref: anything()
            },
            ContentType: 'text/plain'
          })
        );
      });

      it('sets explicitly sets InitOnly to false', () => {
        expectCDK(stack).to(
          haveResource('Custom::HostedConfigurationVersion', {
            InitOnly: false
          })
        );
      });

      it('retains old versions by default, to preserve version history', () => {
        expectCDK(stack).to(
          haveResource(
            'Custom::HostedConfigurationVersion',
            {
              UpdateReplacePolicy: 'Retain',
              DeletionPolicy: 'Retain'
            },
            ResourcePart.CompleteDefinition
          )
        );
      });

      it('has access to create and delete hosted configuration versions', () => {
        expectCDK(stack).to(
          haveResourceLike('AWS::IAM::Policy', {
            PolicyDocument: {
              Statement: [
                {
                  Action: ['appconfig:CreateHostedConfigurationVersion', 'appconfig:DeleteHostedConfigurationVersion'],
                  Effect: 'Allow'
                }
              ]
            }
          })
        );
      });
    });

    describe('with optional props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack, 'MyApplication');
      const profile = buildHostedProfile(stack, { application });

      new appconfig.HostedConfigurationVersion(stack, 'MyConfigVersion', {
        application,
        configurationProfile: profile,
        contentType: appconfig.ContentType.TEXT,
        content: appconfig.Content.fromInline('My configuration content'),
        description: 'My hosted configuration version',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        initOnly: true
      });

      it('creates a hosted configuration version resource with optional properties', () => {
        expectCDK(stack).to(
          haveResourceLike(
            'Custom::HostedConfigurationVersion',
            {
              Properties: {
                ApplicationId: {
                  Ref: anything()
                },
                ConfigurationProfileId: {
                  Ref: anything()
                },
                ContentType: 'text/plain',
                Description: 'My hosted configuration version',
                InitOnly: true
              },
              UpdateReplacePolicy: 'Delete',
              DeletionPolicy: 'Delete'
            },
            ResourcePart.CompleteDefinition
          )
        );
      });
    });

    describe('with inline content', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack, 'MyApplication');
      const profile = buildHostedProfile(stack, { application });

      new appconfig.HostedConfigurationVersion(stack, 'MyConfigVersion', {
        application,
        configurationProfile: profile,
        contentType: appconfig.ContentType.TEXT,
        content: appconfig.Content.fromInline('Hello, World!')
      });

      it('has a content config with inline content', () => {
        expectCDK(stack).to(
          haveResource('Custom::HostedConfigurationVersion', {
            ContentType: 'text/plain',
            ContentConfig: {
              InlineContent: 'Hello, World!'
            }
          })
        );
      });
    });

    describe('with asset content', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack, 'MyApplication');
      const profile = buildHostedProfile(stack, { application });

      new appconfig.HostedConfigurationVersion(stack, 'MyConfigVersion', {
        application,
        configurationProfile: profile,
        contentType: appconfig.ContentType.YAML,
        content: appconfig.Content.fromAsset(path.join(__dirname, '__fixtures__/config.yml'))
      });

      it('has a content config with s3 location attributes', () => {
        expectCDK(stack).to(
          haveResource('Custom::HostedConfigurationVersion', {
            ContentType: 'application/x-yaml',
            ContentConfig: {
              S3Location: {
                BucketName: { Ref: anything() },
                ObjectKey: anything()
              }
            }
          })
        );
      });

      it('has access to read objects from the bucket', () => {
        expectCDK(stack).to(
          haveResourceLike('AWS::IAM::Policy', {
            PolicyDocument: {
              Statement: [
                {
                  Action: ['appconfig:CreateHostedConfigurationVersion', 'appconfig:DeleteHostedConfigurationVersion'],
                  Effect: 'Allow'
                },
                {
                  Action: 's3:GetObject*',
                  Effect: 'Allow'
                }
              ]
            }
          })
        );
      });
    });

    describe('with bucket content', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack, 'MyApplication');
      const profile = buildHostedProfile(stack, { application });

      const configBucket = s3.Bucket.fromBucketName(stack, 'ConfigBucket', 'my-config-bucket');

      new appconfig.HostedConfigurationVersion(stack, 'MyConfigVersion', {
        application,
        configurationProfile: profile,
        contentType: appconfig.ContentType.JSON,
        content: appconfig.Content.fromBucket(configBucket, 'config.json')
      });

      it('has a content config with s3 location attributes', () => {
        expectCDK(stack).to(
          haveResource('Custom::HostedConfigurationVersion', {
            ContentType: 'application/json',
            ContentConfig: {
              S3Location: {
                BucketName: 'my-config-bucket',
                ObjectKey: 'config.json'
              }
            }
          })
        );
      });
    });
  });
});
