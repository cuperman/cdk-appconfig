import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';

import { JsonSchemaValidator, InlineJsonSchemaValidator, LambdaValidator } from '../../lib/appconfig';
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
          expect(validatorConfig.type).toEqual('JSON_SCHEMA');
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
      const lambdaValidatorHandler = new lambda.Function(stack, 'LambdaValidatorHandler', {
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromInline(`
          exports.handler = function(event) {
            return true;
          };
        `),
        handler: 'index.handler'
      });
      const lambdaValidator = LambdaValidator.fromLambdaFunction(lambdaValidatorHandler);

      it('returns a LambdaValidator object', () => {
        expect(lambdaValidator).toBeInstanceOf(LambdaValidator);
      });

      describe('on bind', () => {
        const validatorConfig = lambdaValidator.bind(stack);

        // FIXME:
        xit('returns a ContentConfig with a reference to a lambda function', () => {
          expect(validatorConfig.type).toEqual('LAMBDA');
          expect(validatorConfig.content).toEqual({
            'Fn::GetAtt': [cdk.Names.uniqueId(lambdaValidatorHandler), 'Arn']
          });
        });

        // FIXME:
        xit('allows appconfig to invoke it', () => {
          expectCDK(stack).to(
            haveResource('AWS::Lambda::Permission', {
              Action: 'lambda:InvokeFunction',
              FunctionName: {
                'Fn::GetAtt': [cdk.Names.uniqueId(lambdaValidatorHandler), 'Arn']
              },
              Principal: 'appconfig.amazonaws.com'
            })
          );
        });
      });
    });
  });
});
