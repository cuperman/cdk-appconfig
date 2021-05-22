import * as path from 'path';

import * as cdk from '@aws-cdk/core';
import { expect as expectCDK, haveResource, anything } from '@aws-cdk/assert';

import * as appconfig from '../lib';

class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const application = new appconfig.Application(this, 'MyApp', {
      name: 'My Application'
    });

    new appconfig.Environment(this, 'MyEnv', {
      application,
      name: 'Prod'
    });

    const configurationProfile = new appconfig.HostedConfigurationProfile(this, 'MyConfig', {
      application,
      name: 'My Config'
    });

    new appconfig.HostedConfigurationVersion(this, 'MyConfigContent', {
      application,
      configurationProfile,
      contentType: appconfig.ContentType.YAML,
      content: appconfig.Content.fromAsset(path.join(__dirname, '__fixtures__/config.yml'))
    });
  }
}

describe('ExampleStack', () => {
  const app = new cdk.App();
  const example = new ExampleStack(app, 'Example1');

  it('has an AppConfig Application', () => {
    expectCDK(example).to(haveResource('AWS::AppConfig::Application'));
  });

  it('has an environment', () => {
    expectCDK(example).to(haveResource('AWS::AppConfig::Environment'));
  });

  it('has a configuration profile', () => {
    expectCDK(example).to(haveResource('AWS::AppConfig::ConfigurationProfile'));
  });

  it('has a hosted configuration version with asset content', () => {
    expectCDK(example).to(
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
});
