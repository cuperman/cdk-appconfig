import * as path from 'path';

import * as cdk from '@aws-cdk/core';
import * as appconfig from '@cuperman/cdk-appconfig';

export class HostedConfigurationStack extends cdk.Stack {
  public app: appconfig.IApplication;
  public profile: appconfig.IConfigurationProfile;
  public version: appconfig.IHostedConfigurationVersion;
  public env: appconfig.IEnvironment;
  public strategy: appconfig.IDeploymentStrategy;
  public deployment: appconfig.Deployment;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.app = new appconfig.Application(this, 'App', {
      name: 'Hosted Configuration Example'
    });

    this.profile = new appconfig.HostedConfigurationProfile(this, 'Profile', {
      application: this.app,
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

    this.version = new appconfig.HostedConfigurationVersion(this, 'Version', {
      application: this.app,
      configurationProfile: this.profile,
      contentType: appconfig.ContentType.JSON,
      content: appconfig.Content.fromAsset(path.join(__dirname, '../config/hosted_config.json'))
    });

    this.env = new appconfig.Environment(this, 'Env', {
      application: this.app,
      name: 'prod'
    });

    this.strategy = appconfig.DeploymentStrategy.fromPredefined(
      this,
      'Strategy',
      appconfig.PredefinedDeploymentStrategy.ALL_AT_ONCE
    );

    this.deployment = new appconfig.Deployment(this, 'Deployment', {
      application: this.app,
      configurationProfile: this.profile,
      configurationVersionNumber: this.version.versionNumber,
      environment: this.env,
      deploymentStrategy: this.strategy
    });
  }
}
