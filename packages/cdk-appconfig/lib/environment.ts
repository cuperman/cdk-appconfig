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
  public readonly tags: cdk.TagManager;
  private readonly resource: appconfig.CfnEnvironment;

  constructor(scope: cdk.Construct, id: string, props: EnvironmentProps) {
    super(scope, id);

    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.DESTROY;

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::Environment');

    const alarmRole = new iam.Role(this, 'AlarmRole', {
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

    const monitors: appconfig.CfnEnvironment.MonitorsProperty[] | undefined = props.alarms?.map((alarm) => {
      return {
        alarmArn: alarm.alarmArn,
        alarmRoleArn: alarmRole.roleArn
      };
    });

    this.resource = new appconfig.CfnEnvironment(this, 'Resource', {
      applicationId: props.application.applicationId,
      name: props.name || cdk.Names.uniqueId(this),
      description: props.description,
      monitors
    });

    this.resource.applyRemovalPolicy(props.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.environmentId = this.resource.ref;
  }

  protected prepare() {
    this.resource.tags = this.tags.renderTags();
  }
}
