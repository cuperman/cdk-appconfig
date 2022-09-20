import * as path from 'path';

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { IApplication } from './application';
import { IConfigurationProfile } from './configuration_profile';
import { ContentType, Content } from './content';

const HANDLER_CODE_PATH = path.dirname(
  require.resolve('@cuperman/cdk-appconfig-handler-hosted-configuration-version/package.json')
);

function uppercaseProperties(props: { [key: string]: any }): { [key: string]: any } {
  if (typeof props !== 'object') {
    return props;
  }

  return Object.entries(props).reduce((accum, [key, value]) => {
    const upper = key.substring(0, 1).toUpperCase() + key.substring(1);
    return { ...accum, [upper]: uppercaseProperties(value) };
  }, {});
}

export interface IHostedConfigurationVersion {
  readonly versionNumber: string;
  readonly hostedConfigurationVersionArn: string;
}

export interface HostedConfigurationVersionProps {
  readonly application: IApplication;
  readonly configurationProfile: IConfigurationProfile;
  readonly contentType: ContentType;
  readonly content: Content;
  readonly description?: string;
  readonly latestVersionNumber?: string;
  readonly initOnly?: boolean;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class HostedConfigurationVersion extends cdk.Resource implements IHostedConfigurationVersion {
  public readonly application: IApplication;
  public readonly configurationProfile: IConfigurationProfile;
  public readonly versionNumber: string;
  public readonly hostedConfigurationVersionArn: string;

  constructor(scope: Construct, id: string, props: HostedConfigurationVersionProps) {
    super(scope, id);

    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.RETAIN;

    this.application = props.application;
    this.configurationProfile = props.configurationProfile;

    const contentConfig = props.content.bind(this);

    const onEventHandler = new lambda.SingletonFunction(this, 'OnEventHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(HANDLER_CODE_PATH),
      handler: 'index.onEvent',
      uuid: 'd9e6c544-62d9-4991-8587-c05873c14f91',
      timeout: cdk.Duration.minutes(15)
    });

    onEventHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['appconfig:CreateHostedConfigurationVersion', 'appconfig:DeleteHostedConfigurationVersion'],
        resources: [
          `arn:aws:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:application/*`,
          `arn:aws:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:application/*/configurationprofile/*`
        ]
      })
    );

    if (contentConfig.s3Location) {
      onEventHandler.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['s3:GetObject*'],
          resources: [`arn:aws:s3:::${contentConfig.s3Location.bucketName}/*`]
        })
      );
    }

    const provider = new cr.Provider(this, 'Provider', {
      onEventHandler
    });

    const resource = new cdk.CustomResource(this, 'CustomResource', {
      resourceType: 'Custom::HostedConfigurationVersion',
      serviceToken: provider.serviceToken,
      pascalCaseProperties: true,
      properties: {
        applicationId: this.application.applicationId,
        configurationProfileId: this.configurationProfile.configurationProfileId,
        contentType: props.contentType,
        contentConfig: uppercaseProperties(contentConfig),
        description: props.description,
        latestVersionNumber: props.latestVersionNumber,
        initOnly: !!props.initOnly
      },
      removalPolicy: props.removalPolicy || DEFAULT_REMOVAL_POLICY
    });

    this.versionNumber = resource.ref;
    this.hostedConfigurationVersionArn = `${this.configurationProfile.configurationProfileArn}/hostedconfigurationversion/${this.versionNumber}`;
  }
}
