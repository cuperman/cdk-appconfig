import * as path from 'path';

import * as cdk from '@aws-cdk/core';
import * as appconfig from '@cuperman/cdk-appconfig';

interface ExampleStackProps extends cdk.StackProps {}

export class CdkExamplesStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: ExampleStackProps) {
    super(scope, id, props);

    const app = new appconfig.Application(this, 'App', {
      name: 'App'
    });

    new appconfig.Environment(this, 'Env', {
      application: app,
      name: 'prod'
    });

    // const profileValidator = new lambda.Function(this, 'ProfileValidator', {
    //   runtime: lambda.Runtime.NODEJS_12_X,
    //   code: lambda.Code.fromInline(`
    //     exports.handler = async function(event) {
    //       return true;
    //     };
    //   `),
    //   handler: 'index.handler'
    // });

    const profile1 = new appconfig.HostedConfigurationProfile(this, 'Profile1', {
      application: app,
      name: 'Profile #1',
      validators: [
        // appconfig.LambdaValidator.fromLambdaFunction(profileValidator)
        appconfig.JsonSchemaValidator.fromInline(
          '{"$schema": "http://json-schema.org/draft/2019-09/schema#","type":"object"}'
        )
      ]
    });

    new appconfig.HostedConfigurationVersion(this, 'ConfigVersion1', {
      application: app,
      configurationProfile: profile1,
      contentType: appconfig.ContentType.YAML,
      content: appconfig.Content.fromAsset(path.join(__dirname, '../config/config.yml')),
      initOnly: true
    });
  }
}
