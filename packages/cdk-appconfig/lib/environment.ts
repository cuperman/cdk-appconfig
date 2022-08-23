import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

import { IApplication } from './application';
import { IConfigurationProfile } from './configuration_profile';
import { IDeploymentStrategy } from './deployment_strategy';
import { IDeployment, Deployment } from './deployment';

export interface IEnvironment extends cdk.IResource {
  readonly environmentId: string;
  readonly environmentArn: string;
}

export interface EnvironmentProps {
  readonly application: IApplication;
  readonly name?: string;
  readonly description?: string;
  readonly alarms?: cloudwatch.IAlarm[];
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export interface EnvironmentDeploymentProps {
  readonly configurationProfile: IConfigurationProfile;
  readonly configurationVersionNumber: string;
  readonly deploymentStrategy: IDeploymentStrategy;
  readonly description?: string;
}

export class Environment extends cdk.Resource implements IEnvironment, cdk.ITaggable {
  public readonly application: IApplication;
  public readonly environmentId: string;
  public readonly environmentName: string;
  public readonly environmentArn: string;
  public readonly alarms: cloudwatch.IAlarm[];
  public readonly deployments: IDeployment[];
  public readonly tags: cdk.TagManager;
  private readonly resource: cdk.CfnResource;
  private readonly alarmRole: iam.IRole;

  constructor(scope: Construct, id: string, props: EnvironmentProps) {
    super(scope, id);

    const RESOURCE_TYPE = 'AWS::AppConfig::Environment';
    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.DESTROY;

    this.application = props.application;
    this.environmentName = props.name || cdk.Names.uniqueId(this);
    this.tags = new cdk.TagManager(cdk.TagType.KEY_VALUE, RESOURCE_TYPE);

    this.deployments = [];
    this.alarms = [];
    props.alarms?.forEach((alarm) => this.alarms.push(alarm));

    this.alarmRole = new iam.Role(this, 'AlarmRole', {
      assumedBy: new iam.ServicePrincipal('appconfig.amazonaws.com'),
      inlinePolicies: {
        SSMCloudWatchAlarmDiscoveryRole: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['cloudwatch:DescribeAlarms'],
              resources: ['*']
            })
          ]
        })
      }
    });

    this.resource = new cdk.CfnResource(this, 'Resource', {
      type: RESOURCE_TYPE,
      properties: {
        ApplicationId: this.application.applicationId,
        Name: this.environmentName,
        Description: props.description,
        Monitors: cdk.Lazy.any({
          produce: () =>
            this.alarms.map((alarm) => {
              return {
                AlarmArn: alarm.alarmArn,
                AlarmRoleArn: this.alarmRole.roleArn
              };
            })
        }),
        Tags: this.tags.renderedTags
      }
    });

    this.resource.applyRemovalPolicy(props.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.environmentId = this.resource.ref;
    this.environmentArn = `${this.application.applicationArn}/environment/${this.environmentId}`;
  }

  addAlarm(alarm: cloudwatch.IAlarm) {
    this.alarms.push(alarm);
  }

  addDeployment(props: EnvironmentDeploymentProps): IDeployment {
    const counter = this.deployments.length + 1;

    const deployment = new Deployment(this, `Deployment${counter}`, {
      application: this.application,
      environment: this,
      configurationProfile: props.configurationProfile,
      configurationVersionNumber: props.configurationVersionNumber,
      deploymentStrategy: props.deploymentStrategy,
      description: props.description
    });

    // add dependency on previous deployment to prevent concurrent deployments
    if (this.deployments.length > 0) {
      deployment.node.addDependency(this.deployments[this.deployments.length - 1]);
    }

    this.deployments.push(deployment);

    return deployment;
  }
}
