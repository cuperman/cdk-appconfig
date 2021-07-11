import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';
import * as iam from '@aws-cdk/aws-iam';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';

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
  private readonly resource: appconfig.CfnEnvironment;
  private alarmRole?: iam.IRole;

  constructor(scope: cdk.Construct, id: string, props: EnvironmentProps) {
    super(scope, id);

    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.DESTROY;

    this.application = props.application;

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::Environment');

    this.deployments = [];
    this.alarms = [];
    props.alarms?.forEach((alarm) => this.alarms.push(alarm));

    this.resource = new appconfig.CfnEnvironment(this, 'Resource', {
      applicationId: this.application.applicationId,
      name: props.name || cdk.Names.uniqueId(this),
      description: props.description
    });

    this.resource.applyRemovalPolicy(props.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.environmentId = this.resource.ref;
    this.environmentName = this.resource.name;
    this.environmentArn = `${this.application.applicationArn}/environment/${this.environmentId}`;
  }

  protected prepare() {
    if (this.alarms.length > 0 && !this.alarmRole) {
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
    }

    this.resource.monitors = this.alarms.map((alarm) => {
      return {
        alarmArn: alarm.alarmArn,
        alarmRoleArn: this.alarmRole?.roleArn
      };
    });
    this.resource.tags = this.tags.renderTags();
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

  public grantStartDeployment(grantee: iam.IGrantable): iam.Grant {
    return iam.Grant.addToPrincipal({
      grantee,
      actions: ['appconfig:StartDeployment'],
      resourceArns: [
        this.application.applicationArn,
        this.environmentArn,
        `${this.application.applicationArn}/configurationprofile/*`,
        `arn:${cdk.Aws.PARTITION}:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:deploymentstrategy/*`,
        `${this.environmentArn}/deployment/*`
      ]
    });
  }
}
