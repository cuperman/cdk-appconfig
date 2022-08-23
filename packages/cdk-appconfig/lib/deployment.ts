import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

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
  private readonly resource: cdk.CfnResource;

  constructor(scope: Construct, id: string, props: DeploymentProps) {
    super(scope, id);

    const RESOURCE_TYPE = 'AWS::AppConfig::Deployment';

    this.application = props.application;
    this.environment = props.environment;

    this.tags = new cdk.TagManager(cdk.TagType.KEY_VALUE, RESOURCE_TYPE);

    this.resource = new cdk.CfnResource(this, 'Resource', {
      type: RESOURCE_TYPE,
      properties: {
        ApplicationId: this.application.applicationId,
        EnvironmentId: this.environment.environmentId,
        ConfigurationProfileId: props.configurationProfile.configurationProfileId,
        ConfigurationVersion: props.configurationVersionNumber,
        DeploymentStrategyId: props.deploymentStrategy.deploymentStrategyId,
        Description: props.description,
        Tags: this.tags.renderedTags
      }
    });

    this.deploymentId = this.resource.ref;
    this.deploymentArn = `${this.environment.environmentArn}/deployment/${this.deploymentId}`;
  }
}
