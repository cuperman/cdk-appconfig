import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';
import * as iam from '@aws-cdk/aws-iam';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';

import { IApplication } from './application';

export interface IEnvironment extends cdk.IResource {
  readonly environmentId: string;
}

export interface EnvironmentProps {
  readonly application: IApplication;
  readonly name?: string;
  readonly description?: string;
  readonly alarms?: cloudwatch.IAlarm[];
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class Environment extends cdk.Resource implements IEnvironment, cdk.ITaggable {
  public readonly environmentId: string;
  public readonly environmentName: string;
  public readonly alarms: cloudwatch.IAlarm[];
  public readonly tags: cdk.TagManager;
  private readonly resource: appconfig.CfnEnvironment;
  private alarmRole?: iam.IRole;

  constructor(scope: cdk.Construct, id: string, props: EnvironmentProps) {
    super(scope, id);

    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.DESTROY;

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::Environment');

    this.alarms = [];
    props.alarms?.forEach((alarm) => this.alarms.push(alarm));

    this.resource = new appconfig.CfnEnvironment(this, 'Resource', {
      applicationId: props.application.applicationId,
      name: props.name || cdk.Names.uniqueId(this),
      description: props.description
    });

    this.resource.applyRemovalPolicy(props.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.environmentId = this.resource.ref;
    this.environmentName = this.resource.name;
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
}
