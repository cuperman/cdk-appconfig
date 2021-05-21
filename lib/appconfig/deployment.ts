import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';

import { Application } from './application';
import { IConfigurationProfile } from './configuration_profile';
import { IDeploymentStrategy } from './deployment_strategy';
import { Environment } from './environment';

export interface DeploymentProps {
  readonly application: Application;
  readonly configurationProfile: IConfigurationProfile;
  readonly configurationVersionNumber: string;
  readonly deploymentStrategy: IDeploymentStrategy;
  readonly environment: Environment;
  readonly description?: string;
  // TODO
  // readonly removalPolicy?: cdk.RemovalPolicy;
}

export class Deployment extends cdk.Resource {
  public readonly tags: cdk.TagManager;
  private readonly resource: appconfig.CfnDeployment;

  constructor(scope: cdk.Construct, id: string, props: DeploymentProps) {
    super(scope, id);

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::Deployment');

    this.resource = new appconfig.CfnDeployment(this, 'Resource', {
      applicationId: props.application.applicationId,
      environmentId: props.environment.environmentId,
      configurationProfileId: props.configurationProfile.configurationProfileId,
      configurationVersion: props.configurationVersionNumber,
      deploymentStrategyId: props.deploymentStrategy.deploymentStrategyId,
      description: props.description
    });
  }

  protected prepare() {
    this.resource.tags = this.tags.renderTags();
  }
}
