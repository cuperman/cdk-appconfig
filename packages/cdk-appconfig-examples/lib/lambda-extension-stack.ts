/*
 * Reference: https://aws.amazon.com/blogs/mt/introducing-aws-appconfig-lambda-extension-deploying-application-configuration-serverless/
 */

import * as path from 'path';

import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as appconfig from '@cuperman/cdk-appconfig';

const HELLO_WORLD_CODE_PATH = path.join(
  path.dirname(require.resolve('@cuperman/cdk-appconfig-handler-hello-world/package.json')),
  'dist'
);

export class LambdaExtensionStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const application = new appconfig.Application(this, 'Application', {
      name: 'helloworld'
    });

    const environment = new appconfig.Environment(this, 'Environment', {
      application,
      name: 'demo'
    });

    const configuration = new appconfig.HostedConfigurationProfile(this, 'Configuration', {
      application,
      name: 'ExclamationPoints',
      validators: [
        appconfig.JsonSchemaValidator.fromInline(`
          {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "type": "object",
            "properties": {
              "enableExclamationPoints": {
                "type": "boolean"
              },
              "numberOfExclamationPoints": {
                "type": "integer",
                "minimum": 0
              }
            },
            "required": [
              "enableExclamationPoints",
              "numberOfExclamationPoints"
            ]
          }
        `)
      ]
    });

    const helloWorldFunction = new lambda.Function(this, 'HelloWorldFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(HELLO_WORLD_CODE_PATH),
      handler: 'index.lambdaHandler',
      environment: {
        AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS: '45', // default: 45 seconds
        AWS_APPCONFIG_EXTENSION_POLL_TIMEOUT_MILLIS: '3000', // default: 3000 milliseconds
        AWS_APPCONFIG_EXTENSION_HTTP_PORT: '2772', // default: 2772
        AWS_APPCONFIG_APPLICATION_NAME: application.applicationName,
        AWS_APPCONFIG_ENVIRONMENT_NAME: environment.environmentName,
        AWS_APPCONFIG_CONFIGURATION_PROFILE_NAME: configuration.configurationProfileName
      }
    });

    // apply lambda extension
    helloWorldFunction.addLayers(new appconfig.LambdaExtensionLayer(this, 'AppConfigLambdaExtension'));

    // allow lambda function to get configurations from appconfig
    configuration.grantGetConfiguration(helloWorldFunction);

    // roll back on lambda errors
    environment.addAlarm(
      helloWorldFunction.metricErrors().createAlarm(this, 'HelloWorldErrors', {
        threshold: 1,
        evaluationPeriods: 1
      })
    );
  }
}
