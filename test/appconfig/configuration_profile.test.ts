import { expect as expectCDK, haveResource, anything } from '@aws-cdk/assert';

import { buildCdkStack, buildApplication } from './helpers';
import { HostedConfigurationProfile } from '../../lib/appconfig';

describe('AppConfig', () => {
  describe('HostedConfigurationProfile', () => {
    describe('with required props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack);

      const profile = new HostedConfigurationProfile(stack, 'MyProfile', {
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

      new HostedConfigurationProfile(stack, 'MyProfile', {
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

      new HostedConfigurationProfile(stack, 'MyProfile', {
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
});
