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

    const configuration = new appconfig.HostedConfigurationProfile(this, 'Profile', {
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
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'AppConfigLambdaExtension',
          // TODO: make dynamic
          // ref: https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions.html#appconfig-integration-lambda-extensions-enabling
          'arn:aws:lambda:us-east-1:027255383542:layer:AWS-AppConfig-Extension:44'
        )
      ],
      code: lambda.Code.fromAsset(HELLO_WORLD_CODE_PATH),
      handler: 'index.lambdaHandler',
      environment: {
        AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS: '45', // default: 45 seconds
        AWS_APPCONFIG_EXTENSION_POLL_TIMEOUT_MILLIS: '3000', // default: 3000 milliseconds
        AWS_APPCONFIG_EXTENSION_HTTP_PORT: '2772', // default: 2772
        // APPCONFIG_APPLICATION_ID: application.applicationId,
        // APPCONFIG_ENVIRONMENT_ID: environment.environmentId,
        // APPCONFIG_CONFIGURATION_PROFILE_ID: configuration.configurationProfileId,
        AWS_APPCONFIG_EXTENSION_HTTP_URL: `http://localhost:2772/applications/${application.applicationId}/environments/${environment.environmentId}/configurations/${configuration.configurationProfileId}`
      }
    });

    // allow lambda function to get configurations from appconfig
    configuration.grantGetConfiguration(helloWorldFunction, environment);
  }
}
