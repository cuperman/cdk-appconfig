import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';

export interface IDeploymentStrategy extends cdk.IResource {
  readonly deploymentStrategyId: string;
}

export class DeploymentStrategyImport extends cdk.Resource implements IDeploymentStrategy {
  public readonly deploymentStrategyId: string;

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

export enum DeploymentStrategyReplication {
  NONE = 'NONE',
  SSM_DOCUMENT = 'SSM_DOCUMENT'
}

export enum DeploymentStrategyGrowthType {
  EXPONENTIAL = 'EXPONENTIAL',
  LINEAR = 'LINEAR'
}

export interface DeploymentStrategyProps {
  readonly name: string;
  readonly deploymentDurationInMinutes: number;
  readonly growthFactor: number;
  readonly replicateTo?: DeploymentStrategyReplication;
  readonly description?: string;
  readonly finalBakeTimeInMinutes?: number;
  readonly growthType?: DeploymentStrategyGrowthType;
  // TODO
  // readonly removalPolicy?: cdk.RemovalPolicy;
}

export class DeploymentStrategy extends cdk.Resource implements IDeploymentStrategy {
  public readonly deploymentStrategyId: string;
  public readonly tags: cdk.TagManager;
  private readonly resource: appconfig.CfnDeploymentStrategy;

  constructor(scope: cdk.Construct, id: string, props: DeploymentStrategyProps) {
    super(scope, id, {
      physicalName: props.name
    });

    const DEFAULT_REPLICATION = DeploymentStrategyReplication.NONE;

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::DeploymentStrategy');

    this.resource = new appconfig.CfnDeploymentStrategy(this, 'Resource', {
      name: props.name,
      deploymentDurationInMinutes: props.deploymentDurationInMinutes,
      growthFactor: props.growthFactor,
      replicateTo: props.replicateTo || DEFAULT_REPLICATION,
      description: props.description,
      finalBakeTimeInMinutes: props.finalBakeTimeInMinutes,
      growthType: props.growthType
    });

    this.deploymentStrategyId = this.resource.ref;
  }

  public static fromId(scope: cdk.Construct, id: string, deploymentStrategyId: string) {
    return new DeploymentStrategyImport(scope, id, deploymentStrategyId);
  }

  public static fromPredefined(
    scope: cdk.Construct,
    id: string,
    predefinedDeploymentStrategy: PredefinedDeploymentStrategy
  ) {
    return new DeploymentStrategyImport(scope, id, predefinedDeploymentStrategy);
  }

  protected prepare() {
    this.resource.tags = this.tags.renderTags();
  }
}
