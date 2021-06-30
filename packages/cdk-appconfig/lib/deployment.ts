import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';

import { IApplication } from './application';
import { IConfigurationProfile } from './configuration_profile';
import { IDeploymentStrategy } from './deployment_strategy';
import { IEnvironment } from './environment';

export interface IDeployment extends cdk.IResource {
  readonly deploymentId: string;
  readonly deploymentArn: string;
}

export interface DeploymentProps {
  readonly application: IApplication;
  readonly configurationProfile: IConfigurationProfile;
  readonly configurationVersionNumber: string;
  readonly deploymentStrategy: IDeploymentStrategy;
  readonly environment: IEnvironment;
  readonly description?: string;
}

export class Deployment extends cdk.Resource implements IDeployment, cdk.ITaggable {
  public readonly application: IApplication;
  public readonly environment: IEnvironment;
  public readonly deploymentId: string;
  public readonly deploymentArn: string;
  public readonly tags: cdk.TagManager;
  private readonly resource: appconfig.CfnDeployment;

  constructor(scope: cdk.Construct, id: string, props: DeploymentProps) {
    super(scope, id);

    this.application = props.application;
    this.environment = props.environment;

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::Deployment');

    this.resource = new appconfig.CfnDeployment(this, 'Resource', {
      applicationId: this.application.applicationId,
      environmentId: this.environment.environmentId,
      configurationProfileId: props.configurationProfile.configurationProfileId,
      configurationVersion: props.configurationVersionNumber,
      deploymentStrategyId: props.deploymentStrategy.deploymentStrategyId,
      description: props.description
    });

    this.deploymentId = this.resource.ref;
    this.deploymentArn = `${this.environment.environmentArn}/deployment/${this.deploymentId}`;
  }

  protected prepare() {
    this.resource.tags = this.tags.renderTags();
  }
}
