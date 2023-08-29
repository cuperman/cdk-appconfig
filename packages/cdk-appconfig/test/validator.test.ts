// Workaround for deprecated @aws-cdk/assert dependency on global TextDecoder
import { TextDecoder } from 'util';
(global as any).TextDecoder = TextDecoder;
// End workaround

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import {
  JsonSchemaValidator,
  InlineJsonSchemaValidator,
  LambdaValidator,
  Application,
  HostedConfigurationProfile
} from '../lib';
import { expect as expectCDK, haveResource } from '@aws-cdk/assert';

describe('AppConfig', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');

  describe('JsonSchemaValidator', () => {
    describe('fromInline', () => {
      const jsonSchema = '{"$schema": "http://json-schema.org/draft/2019-09/schema#","type":"object"}';
      const inlineSchemaValidator = JsonSchemaValidator.fromInline(jsonSchema);

      it('returns an InlineJsonSchemaValidator object', () => {
        expect(inlineSchemaValidator).toBeInstanceOf(InlineJsonSchemaValidator);
      });

      describe('on bind', () => {
        const validatorConfig = inlineSchemaValidator.bind(stack);

        it('returns a ContentConfig with inline JSON schema', () => {
          expect(validatorConfig.validatorType).toEqual('JSON_SCHEMA');
          expect(validatorConfig.content).toEqual(jsonSchema);
        });
      });
    });

    describe('fromBucket', () => {
      it.todo('returns a BucketJsonSchemaValidator object');
    });

    describe('fromAsset', () => {
      it.todo('returns an AssetJsonSchemaValidator object');
    });
  });

  describe('LambdaValidator', () => {
    describe('fromLambdaFunction', () => {
      const app = new Application(stack, 'MyApp', {
        name: 'My App'
      });
      const lambdaValidatorHandler = new lambda.Function(stack, 'LambdaValidatorHandler', {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromInline(`
            exports.handler = function(event) {
              return true;
            };
          `),
        handler: 'index.handler'
      });
      const lambdaValidator = LambdaValidator.fromLambdaFunction(lambdaValidatorHandler);
      new HostedConfigurationProfile(stack, 'MyProfile', {
        application: app,
        name: 'My Profile',
        validators: [lambdaValidator]
      });

      const lambdaValidatorHandlerId = stack.getLogicalId(
        lambdaValidatorHandler.node.defaultChild as lambda.CfnFunction
      );

      it('returns a LambdaValidator object', () => {
        expect(lambdaValidator).toBeInstanceOf(LambdaValidator);
      });

      describe('on bind', () => {
        it('returns a ValidatorConfig with a reference to a lambda function', () => {
          expectCDK(stack).to(
            haveResource('AWS::AppConfig::ConfigurationProfile', {
              Name: 'My Profile',
              Validators: [
                {
                  Type: 'LAMBDA',
                  Content: {
                    'Fn::GetAtt': [lambdaValidatorHandlerId, 'Arn']
                  }
                }
              ]
            })
          );
        });

        it('allows appconfig to invoke it', () => {
          expectCDK(stack).to(
            haveResource('AWS::Lambda::Permission', {
              Action: 'lambda:InvokeFunction',
              FunctionName: {
                'Fn::GetAtt': [lambdaValidatorHandlerId, 'Arn']
              },
              Principal: 'appconfig.amazonaws.com'
            })
          );
        });
      });
    });
  });
});
