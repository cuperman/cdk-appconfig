import * as lambda from 'aws-cdk-lib/aws-lambda';

import { LambdaExtensionLayer } from '../lib';
import { buildCdkStack } from './helpers';
import { expect as expectCDK, haveResource } from '@aws-cdk/assert';

describe('AppConfig', () => {
  describe('LambdaExtensionLayer', () => {
    const stack = buildCdkStack();

    const lambdaExtensionLayer = new LambdaExtensionLayer(stack, 'MyLambdaExtension1');

    describe('with default props', () => {
      it('uses region pseudo parameters to determine resource arn', () => {
        const fn = new lambda.Function(stack, 'MyLambda1', {
          runtime: lambda.Runtime.NODEJS_12_X,
          code: lambda.Code.fromInline(`
            exports.handler = async () => {
              return 'Hello, World!';
            };
          `),
          handler: 'index.handler'
        });

        fn.addLayers(lambdaExtensionLayer);

        expectCDK(stack).to(
          haveResource('AWS::Lambda::Function', {
            Layers: [
              {
                'Fn::FindInMap': [
                  'LambdaExtensionMap',
                  {
                    Ref: 'AWS::Region'
                  },
                  'arn'
                ]
              }
            ]
          })
        );
      });

      describe('with a specific region', () => {
        const stack = buildCdkStack();
        const lambdaExtensionLayer = new LambdaExtensionLayer(stack, 'MyLambdaExtension', {
          region: 'eu-west-1'
        });

        it('uses specified region to determine resource arn', () => {
          const fn = new lambda.Function(stack, 'MyLambda', {
            runtime: lambda.Runtime.NODEJS_12_X,
            code: lambda.Code.fromInline(`
              exports.handler = async () => {
                return 'Hello, World!';
              };
            `),
            handler: 'index.handler'
          });

          fn.addLayers(lambdaExtensionLayer);

          expectCDK(stack).to(
            haveResource('AWS::Lambda::Function', {
              Layers: [
                {
                  'Fn::FindInMap': ['LambdaExtensionMap', 'eu-west-1', 'arn']
                }
              ]
            })
          );
        });
      });
    });
  });
});
