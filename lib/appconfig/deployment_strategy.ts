import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';

export interface IDeploymentStrategy extends cdk.IResource {
  readonly deploymentStrategyId: string;
}

export class DeploymentStrategyPlaceholder extends cdk.Resource implements IDeploymentStrategy {
  public deploymentStrategyId: string;

  constructor(scope: cdk.Construct, id: string, deploymentStrategyId: string) {
    super(scope, id);
    this.deploymentStrategyId = deploymentStrategyId;
  }
}

export enum PredefinedDeploymentStrategy {
  ALL_AT_ONCE = 'AppConfig.AllAtOnce',
  LINEAR_50_PERCENT_EVERY_30_SECONDS = 'AppConfig.Linear50PercentEvery30Seconds',
  CANARY_10_PERCENT_20_MINUTES = 'AppConfig.Canary10Percent20Minutes'
}

export interface DeploymentStrategyProps {
  readonly name: string;
}

export class DeploymentStrategy extends cdk.Resource implements IDeploymentStrategy {
  public readonly deploymentStrategyId: string;
  private readonly resource: appconfig.CfnDeploymentStrategy;

  constructor(scope: cdk.Construct, id: string, props: DeploymentStrategyProps) {
    super(scope, id);

    this.resource = new appconfig.CfnDeploymentStrategy(this, 'Resource', {
      deploymentDurationInMinutes: 0,
      growthFactor: 100,
      name: props.name,
      replicateTo: 'NONE'
    });

    this.deploymentStrategyId = this.resource.ref;
  }

  public static fromId(scope: cdk.Construct, id: string, deploymentStrategyId: string) {
    return new DeploymentStrategyPlaceholder(scope, id, deploymentStrategyId);
  }

  public static fromPredefined(
    scope: cdk.Construct,
    id: string,
    predefinedDeploymentStrategy: PredefinedDeploymentStrategy
  ) {
    return new DeploymentStrategyPlaceholder(scope, id, predefinedDeploymentStrategy);
  }
}
