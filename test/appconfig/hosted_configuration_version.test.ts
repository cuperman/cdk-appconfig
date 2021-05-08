import { expect as expectCDK, haveResource, anything } from '@aws-cdk/assert';

import { buildCdkStack, buildApplication, buildHostedProfile } from './helpers';
import * as appconfig from '../../lib/appconfig';

describe('AppConfig', () => {
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
