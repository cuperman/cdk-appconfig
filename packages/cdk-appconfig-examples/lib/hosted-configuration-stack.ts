import * as path from 'path';

import * as cdk from '@aws-cdk/core';
import * as appconfig from '@cuperman/cdk-appconfig';

export class HostedConfigurationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const app = new appconfig.Application(this, 'App', {
      name: 'Hosted Configuration Example'
    });

    const profile = new appconfig.HostedConfigurationProfile(this, 'Profile', {
      application: app,
      name: 'Hosted Configuration Profile',
      validators: [
        appconfig.JsonSchemaValidator.fromInline(
          `{
            "$schema": "http://json-schema.org/draft-04/schema#",
            "type": "object",
            "properties": {
              "message": { "type": "string" }
            },
            "required": ["message"],
            "additionalProperties": true
          }`
        )
      ]
    });

    const version = new appconfig.HostedConfigurationVersion(this, 'Version', {
      application: app,
      configurationProfile: profile,
      contentType: appconfig.ContentType.JSON,
      content: appconfig.Content.fromAsset(path.join(__dirname, '../config/hosted_config.json'))
    });

    const env = new appconfig.Environment(this, 'Env', {
      application: app,
      name: 'prod'
    });

    const strategy = appconfig.DeploymentStrategy.fromPredefined(
      this,
      'Strategy',
      appconfig.PredefinedDeploymentStrategy.ALL_AT_ONCE
    );

    new appconfig.Deployment(this, 'Deployment', {
      application: app,
      configurationProfile: profile,
      configurationVersionNumber: version.versionNumber,
      environment: env,
      deploymentStrategy: strategy
    });
  }
}
