import { expect as expectCDK, haveResource } from '@aws-cdk/assert';

import { buildCdkStack, buildApplication } from './helpers';
import { Application } from '../../lib/appconfig';

describe('AppConfig', () => {
  describe('Application', () => {
    describe('with required props', () => {
      const stack = buildCdkStack();

      const application = new Application(stack, 'MyApplication', {
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

      new Application(stack, 'MyApplication', {
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
});
