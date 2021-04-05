import * as cdk from '@aws-cdk/core';
import { expect as expectCDK, haveResource, anything } from '@aws-cdk/assert';

import * as appconfig from '../lib/appconfig';

interface Tags {
  [key: string]: string;
}

function buildCdkApp() {
  return new cdk.App();
}

function buildCdkStack(options?: { tags?: Tags }) {
  const app = buildCdkApp();
  const stack = new cdk.Stack(app, 'MyStack', { tags: options?.tags });

  if (options?.tags) {
    Object.entries(options.tags).forEach(([key, value]) => {
      cdk.Tags.of(stack).add(key, value);
    });
  }

  return stack;
}

function buildApplication(scope: cdk.Construct, options?: { name?: string }) {
  return new appconfig.Application(scope, 'MyApplication', {
    name: options?.name || 'MyApplication'
  });
}

function buildHostedProfile(scope: cdk.Construct, options?: { application?: appconfig.Application; name?: string }) {
  return new appconfig.HostedConfigurationProfile(scope, 'MyHostedConfigurationProfile', {
    application: options?.application || buildApplication(scope),
    name: options?.name || 'MyHostedConfigurationProfile'
  });
}

describe('AppConfig', () => {
  describe('Application', () => {
    describe('with required props', () => {
      const stack = buildCdkStack();

      const application = new appconfig.Application(stack, 'MyApplication', {
        name: 'MyApp'
      });

      it('has an application id', () => {
        expect(typeof application.applicationId).toEqual('string');
      });

      it('creates an application resource with required properties', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::Application', {
            Name: 'MyApp'
          })
        );
      });
    });

    describe('with optional props', () => {
      const stack = buildCdkStack();

      new appconfig.Application(stack, 'MyApplication', {
        name: 'MyApp',
        description: 'My application'
      });

      it('creates an application resource with optional properties', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::Application', {
            Name: 'MyApp',
            Description: 'My application'
          })
        );
      });
    });

    describe('with tags', () => {
      const stack = buildCdkStack({
        tags: { Foo: 'Bar', Kanye: 'West' }
      });

      buildApplication(stack);

      it('applies tags', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::Application', {
            Tags: [
              { Key: 'Foo', Value: 'Bar' },
              { Key: 'Kanye', Value: 'West' }
            ]
          })
        );
      });
    });
  });

  describe('HostedConfigurationProfile', () => {
    describe('with required props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack);

      const profile = new appconfig.HostedConfigurationProfile(stack, 'MyProfile', {
        application,
        name: 'MyProfile'
      });

      it('has a configuration profile id', () => {
        expect(typeof profile.configurationProfileId).toEqual('string');
      });

      it('creates a configuration profile resource with required properties', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::ConfigurationProfile', {
            ApplicationId: {
              Ref: anything()
            },
            Name: 'MyProfile',
            LocationUri: 'hosted'
          })
        );
      });
    });

    describe('with optional props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack);

      new appconfig.HostedConfigurationProfile(stack, 'MyProfile', {
        application,
        name: 'MyProfile',
        description: 'My configuration profile'
      });

      it('creates a configuration profile resource with optional properties', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::ConfigurationProfile', {
            ApplicationId: {
              Ref: anything()
            },
            Name: 'MyProfile',
            LocationUri: 'hosted',
            Description: 'My configuration profile'
          })
        );
      });
    });

    describe('with tags', () => {
      const stack = buildCdkStack({ tags: { Foo: 'Bar', Kanye: 'West' } });
      const application = buildApplication(stack);

      new appconfig.HostedConfigurationProfile(stack, 'MyProfile', {
        application,
        name: 'MyProfile'
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
  });

  describe('Environment', () => {
    describe('with required props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack);

      const environment = new appconfig.Environment(stack, 'MyEnvironment', {
        application,
        name: 'MyEnv'
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
            Name: 'MyEnv'
          })
        );
      });
    });

    describe('with optional props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack);

      new appconfig.Environment(stack, 'MyEnvironment', {
        application,
        name: 'MyEnv',
        description: 'My environment'
      });

      it('creates an environment resource with optional properties', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::Environment', {
            ApplicationId: {
              Ref: anything()
            },
            Name: 'MyEnv',
            Description: 'My environment'
          })
        );
      });
    });

    describe('with tags', () => {
      const stack = buildCdkStack({ tags: { Foo: 'Bar', Kanye: 'West' } });
      const application = buildApplication(stack);

      new appconfig.Environment(stack, 'MyEnvironment', {
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

  describe('HostedConfigurationVersion', () => {
    describe('with required props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack);
      const profile = buildHostedProfile(stack, { application });

      const configVersion = new appconfig.HostedConfigurationVersion(stack, 'MyConfigVersion', {
        application,
        configurationProfile: profile,
        contentType: appconfig.HostedConfigurationContentType.TEXT,
        content: 'My configuration content'
      });

      it('has a version number', () => {
        expect(typeof configVersion.versionNumber).toEqual('string');
      });

      it('creates a hosted configuration version resource with required properties', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::HostedConfigurationVersion', {
            ApplicationId: {
              Ref: anything()
            },
            ConfigurationProfileId: {
              Ref: anything()
            },
            ContentType: 'text/plain',
            Content: 'My configuration content'
          })
        );
      });
    });

    describe('with optional props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack);
      const profile = buildHostedProfile(stack, { application });

      new appconfig.HostedConfigurationVersion(stack, 'MyConfigVersion', {
        application,
        configurationProfile: profile,
        contentType: appconfig.HostedConfigurationContentType.TEXT,
        content: 'My configuration content',
        description: 'My hosted configuration version'
      });

      it('creates a hosted configuration version resource with optional properties', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::HostedConfigurationVersion', {
            ApplicationId: {
              Ref: anything()
            },
            ConfigurationProfileId: {
              Ref: anything()
            },
            ContentType: 'text/plain',
            Content: 'My configuration content',
            Description: 'My hosted configuration version'
          })
        );
      });
    });
  });
});
