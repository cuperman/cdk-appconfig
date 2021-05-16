import { expect as expectCDK, haveResource, anything, ResourcePart } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';

import { buildCdkStack, buildApplication } from './helpers';
import { HostedConfigurationProfile, JsonSchemaValidator, LambdaValidator } from '../../lib/appconfig';

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
      const application = buildApplication(stack);

      new HostedConfigurationProfile(stack, 'MyProfile', {
        application,
        name: 'MyProfile',
        description: 'My configuration profile',
        removalPolicy: cdk.RemovalPolicy.DESTROY
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

    describe('with inline json schema validator', () => {
      const stack = buildCdkStack();
      const application = buildApplication(stack);

      new HostedConfigurationProfile(stack, 'MyProfile', {
        application,
        name: 'MyProfile',
        validators: [
          JsonSchemaValidator.fromInline('{"$schema": "http://json-schema.org/draft/2019-09/schema#","type":"object"}')
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
      const application = buildApplication(stack);
      const lambdaFunction = lambda.Function.fromFunctionArn(
        stack,
        'MyLambda',
        'arn:aws:lambda:us-east-1:123456789012:function:my-function'
      );

      new HostedConfigurationProfile(stack, 'MyProfile', {
        application,
        name: 'MyProfile',
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
});
