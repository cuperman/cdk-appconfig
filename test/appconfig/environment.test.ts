import { expect as expectCDK, haveResource, anything } from '@aws-cdk/assert';

import { buildCdkStack, buildApplication } from './helpers';
import { Environment } from '../../lib/appconfig';

describe('AppConfig', () => {
  describe('Environment', () => {
    describe('with required props', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack);

      const environment = new Environment(stack, 'MyEnvironment', {
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

      new Environment(stack, 'MyEnvironment', {
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
