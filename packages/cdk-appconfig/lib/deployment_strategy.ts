import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface IDeploymentStrategy extends cdk.IResource {
  readonly deploymentStrategyId: string;
  readonly deploymentStrategyArn: string;
}

export class ImportedDeploymentStrategy extends cdk.Resource implements IDeploymentStrategy {
  public readonly deploymentStrategyId: string;
  public readonly deploymentStrategyArn: string;

  constructor(scope: Construct, id: string, deploymentStrategyId: string) {
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
  private readonly resource: cdk.CfnResource;

  constructor(scope: Construct, id: string, props: DeploymentStrategyProps) {
    super(scope, id);

    const RESOURCE_TYPE = 'AWS::AppConfig::DeploymentStrategy';
    const DEFAULT_REPLICATION = DeploymentStrategyReplication.NONE;
    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.DESTROY;

    this.deploymentStrategyName = props.name || cdk.Names.uniqueId(this);
    this.tags = new cdk.TagManager(cdk.TagType.KEY_VALUE, RESOURCE_TYPE);

    this.resource = new cdk.CfnResource(this, 'Resource', {
      type: RESOURCE_TYPE,
      properties: {
        Name: this.deploymentStrategyName,
        DeploymentDurationInMinutes: props.deploymentDuration.toMinutes(),
        GrowthFactor: props.growthFactor,
        ReplicateTo: props.replicateTo || DEFAULT_REPLICATION,
        Description: props.description,
        FinalBakeTimeInMinutes: props.finalBakeTime?.toMinutes(),
        GrowthType: props.growthType,
        Tags: this.tags.renderedTags
      }
    });

    this.resource.applyRemovalPolicy(props.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.deploymentStrategyId = this.resource.ref;
    this.deploymentStrategyArn = `arn:${cdk.Aws.PARTITION}:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:deploymentstrategy/${this.deploymentStrategyId}`;
  }

  public static fromDeploymentStrategyId(
    scope: Construct,
    id: string,
    deploymentStrategyId: PredefinedDeploymentStrategy | string
  ) {
    return new ImportedDeploymentStrategy(scope, id, deploymentStrategyId);
  }
}
