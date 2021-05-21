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
}

export class Deployment extends cdk.Resource {
  constructor(scope: cdk.Construct, id: string, props: DeploymentProps) {
    super(scope, id);

    new appconfig.CfnDeployment(this, 'Resource', {
      applicationId: props.application.applicationId,
      environmentId: props.environment.environmentId,
      configurationProfileId: props.configurationProfile.configurationProfileId,
      configurationVersion: props.configurationVersionNumber,
      deploymentStrategyId: props.deploymentStrategy.deploymentStrategyId
    });
  }
}
