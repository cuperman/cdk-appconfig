import * as cdk from '@aws-cdk/core';
import { expect as expectCDK, haveResource } from '@aws-cdk/assert';

import * as appconfig from '../lib/appconfig';

class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const application = new appconfig.Application(this, 'MyApplication', {
      name: 'MyApplication'
    });

    new appconfig.Environment(this, 'MyEnvironment', {
      application,
      name: 'MyEnvironment'
    });

    const configurationProfile = new appconfig.HostedConfigurationProfile(this, 'MyConfiguration', {
      application,
      name: 'MyConfiguration'
    });

    new appconfig.HostedConfigurationVersion(this, 'MyHostedConfigurationVersion', {
      application,
      configurationProfile,
      contentType: appconfig.HostedConfigurationContentType.TEXT,
      content: 'My hosted configuration content'
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

  it('has a hosted configuration version', () => {
    expectCDK(example).to(haveResource('AWS::AppConfig::HostedConfigurationVersion'));
  });
});
