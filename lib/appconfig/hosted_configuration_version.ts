import * as path from 'path';

import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cr from '@aws-cdk/custom-resources';
import * as iam from '@aws-cdk/aws-iam';

import { Application } from './application';
import { IConfigurationProfile } from './configuration_profile';
import { ContentType, Content } from './content';

function uppercaseProperties(props: { [key: string]: any }): { [key: string]: any } {
  if (typeof props !== 'object') {
    return props;
  }

  return Object.entries(props).reduce((accum, [key, value]) => {
    const upper = key.substr(0, 1).toUpperCase() + key.substr(1);
    return { ...accum, [upper]: uppercaseProperties(value) };
  }, {});
}

export interface HostedConfigurationVersionProps {
  readonly application: Application;
  readonly configurationProfile: IConfigurationProfile;
  readonly contentType: ContentType;
  readonly content: Content;
  readonly description?: string;
  readonly latestVersionNumber?: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class HostedConfigurationVersion extends cdk.Resource {
  public readonly versionNumber: string;

  constructor(scope: cdk.Construct, id: string, props: HostedConfigurationVersionProps) {
    super(scope, id);

    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.RETAIN;

    const contentConfig = props.content.bind(this);

    const onEventHandler = new lambda.SingletonFunction(this, 'OnEventHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../asset')),
      handler: 'index.onEvent',
      uuid: 'c67842de-c9ed-4cbb-906f-3b490af456b8'
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
        applicationId: props.application.applicationId,
        configurationProfileId: props.configurationProfile.configurationProfileId,
        contentType: props.contentType,
        contentConfig: uppercaseProperties(contentConfig),
        description: props.description,
        latestVersionNumber: props.latestVersionNumber
      },
      removalPolicy: props.removalPolicy || DEFAULT_REMOVAL_POLICY
    });

    this.versionNumber = resource.ref;
  }
}
