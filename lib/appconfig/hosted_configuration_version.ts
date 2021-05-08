import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';

import { Application } from './application';
import { IConfigurationProfile } from './configuration_profile';

export enum HostedConfigurationContentType {
  TEXT = 'text/plain',
  JSON = 'application/json',
  YAML = 'application/x-yaml'
}

export interface HostedConfigurationVersionProps {
  readonly application: Application;
  readonly configurationProfile: IConfigurationProfile;
  readonly contentType: HostedConfigurationContentType;
  readonly content: string;
  readonly description?: string;
}

export class HostedConfigurationVersion extends cdk.Resource {
  public readonly versionNumber: string;

  constructor(scope: cdk.Construct, id: string, props: HostedConfigurationVersionProps) {
    super(scope, id);

    const resource = new appconfig.CfnHostedConfigurationVersion(this, 'Resource', {
      applicationId: props.application.applicationId,
      configurationProfileId: props.configurationProfile.configurationProfileId,
      contentType: props.contentType,
      content: props.content,
      description: props.description
      // TODO
      // latestVersionNumber
    });

    this.versionNumber = resource.ref;
  }
}
