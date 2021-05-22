import { expect as expectCDK, haveResource, ResourcePart } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';

import { buildCdkStack, buildApplication } from './helpers';
import { Application } from '../lib';

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

      it("can't delete applications because of nested configuration profiles", () => {
        expectCDK(stack).to(
          haveResource(
            'AWS::AppConfig::Application',
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

      new Application(stack, 'MyApplication', {
        name: 'MyApp',
        description: 'My application',
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });

      it('creates an application resource with optional properties', () => {
        expectCDK(stack).to(
          haveResource(
            'AWS::AppConfig::Application',
            {
              Properties: {
                Name: 'MyApp',
                Description: 'My application'
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
