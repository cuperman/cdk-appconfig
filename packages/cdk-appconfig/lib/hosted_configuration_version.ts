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

export interface RetryOptions {
  readonly maxRetries: number;
  readonly baseDelay: cdk.Duration;
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
  readonly appConfigRetryOptions?: RetryOptions;
  readonly s3RetryOptions?: RetryOptions;
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

    const onEventHandler = new lambda.Function(this, 'OnEventHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(HANDLER_CODE_PATH),
      handler: 'index.onEvent',
      // uuid: 'c67842de-c9ed-4cbb-906f-3b490af456b8'
      timeout: props.appConfigRetryOptions || props.s3RetryOptions ? cdk.Duration.minutes(15) : undefined
    });

    if (props.appConfigRetryOptions) {
      const { maxRetries, baseDelay } = props.appConfigRetryOptions;
      onEventHandler.addEnvironment('RETRY_APPCONFIG_MAX', maxRetries.toString());
      onEventHandler.addEnvironment('RETRY_APPCONFIG_BASE_MS', baseDelay.toMilliseconds().toString());
    }

    if (props.s3RetryOptions) {
      const { maxRetries, baseDelay } = props.s3RetryOptions;
      onEventHandler.addEnvironment('RETRY_S3_MAX', maxRetries.toString());
      onEventHandler.addEnvironment('RETRY_S3_BASE_MS', baseDelay.toMilliseconds().toString());
    }

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
