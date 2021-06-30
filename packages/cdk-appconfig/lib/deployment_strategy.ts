import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';

export interface IDeploymentStrategy extends cdk.IResource {
  readonly deploymentStrategyId: string;
  readonly deploymentStrategyArn: string;
}

export class ImportedDeploymentStrategy extends cdk.Resource implements IDeploymentStrategy {
  public readonly deploymentStrategyId: string;
  public readonly deploymentStrategyArn: string;

  constructor(scope: cdk.Construct, id: string, deploymentStrategyId: string) {
    super(scope, id);
    this.deploymentStrategyId = deploymentStrategyId;
    this.deploymentStrategyArn = `arn:${cdk.Aws.PARTITION}:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:deploymentstrategy/${this.deploymentStrategyId}`;
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
  readonly name?: string;
  readonly deploymentDuration: cdk.Duration;
  readonly growthFactor: number;
  readonly replicateTo?: DeploymentStrategyReplication;
  readonly description?: string;
  readonly finalBakeTime?: cdk.Duration;
  readonly growthType?: DeploymentStrategyGrowthType;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class DeploymentStrategy extends cdk.Resource implements IDeploymentStrategy {
  public readonly deploymentStrategyId: string;
  public readonly deploymentStrategyName: string;
  public readonly deploymentStrategyArn: string;
  public readonly tags: cdk.TagManager;
  private readonly resource: appconfig.CfnDeploymentStrategy;

  constructor(scope: cdk.Construct, id: string, props: DeploymentStrategyProps) {
    super(scope, id);

    const DEFAULT_REPLICATION = DeploymentStrategyReplication.NONE;
    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.DESTROY;

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::DeploymentStrategy');

    this.resource = new appconfig.CfnDeploymentStrategy(this, 'Resource', {
      name: props.name || cdk.Names.uniqueId(this),
      deploymentDurationInMinutes: props.deploymentDuration.toMinutes(),
      growthFactor: props.growthFactor,
      replicateTo: props.replicateTo || DEFAULT_REPLICATION,
      description: props.description,
      finalBakeTimeInMinutes: props.finalBakeTime?.toMinutes(),
      growthType: props.growthType
    });

    this.resource.applyRemovalPolicy(props.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.deploymentStrategyId = this.resource.ref;
    this.deploymentStrategyName = this.resource.name;
    this.deploymentStrategyArn = `arn:${cdk.Aws.PARTITION}:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:deploymentstrategy/${this.deploymentStrategyId}`;
  }

  public static fromDeploymentStrategyId(
    scope: cdk.Construct,
    id: string,
    deploymentStrategyId: PredefinedDeploymentStrategy | string
  ) {
    return new ImportedDeploymentStrategy(scope, id, deploymentStrategyId);
  }

  protected prepare() {
    this.resource.tags = this.tags.renderTags();
  }
}
