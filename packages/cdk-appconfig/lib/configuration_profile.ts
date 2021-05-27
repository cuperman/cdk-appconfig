import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';
import * as s3 from '@aws-cdk/aws-s3';

import { Application } from './application';
import { Validator } from './validator';

export interface IConfigurationProfile extends cdk.IResource {
  readonly configurationProfileId: string;
}

export interface ConfigurationProfileBaseProps {
  readonly application: Application;
  readonly name?: string;
  readonly validators?: Validator[];
  readonly description?: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export interface ConfigurationProfileProps extends ConfigurationProfileBaseProps {
  readonly locationUri: string;
}

export class ConfigurationProfile extends cdk.Resource implements IConfigurationProfile, cdk.ITaggable {
  public readonly configurationProfileId: string;
  public readonly tags: cdk.TagManager;
  private readonly resource: appconfig.CfnConfigurationProfile;

  constructor(scope: cdk.Construct, id: string, props: ConfigurationProfileProps) {
    super(scope, id);

    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.RETAIN;

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::ConfigurationProfile');

    const validatorConfigs = props.validators?.map((validator) => validator.bind(this));

    this.resource = new appconfig.CfnConfigurationProfile(this, 'Resource', {
      applicationId: props.application.applicationId,
      name: props.name || cdk.Names.uniqueId(this),
      description: props.description,
      locationUri: props.locationUri,
      validators: validatorConfigs
    });

    this.resource.applyRemovalPolicy(props.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.configurationProfileId = this.resource.ref;
  }

  protected prepare() {
    this.resource.tags = this.tags.renderTags();
  }
}

// TODO
// export class SsmDocumentConfigurationProfile extends ConfigurationProfile {}

// TODO
// export class SsmParameterConfigurationProfile extends ConfigurationProfile {}

export interface S3ConfigurationProfileProps extends ConfigurationProfileBaseProps {
  readonly s3Bucket: s3.IBucket;
  readonly s3ObjectKey: string;
}

export class S3ConfigurationProfile extends ConfigurationProfile {
  constructor(scope: cdk.Construct, id: string, props: S3ConfigurationProfileProps) {
    const locationUri = props.s3Bucket.s3UrlForObject(props.s3ObjectKey);
    super(scope, id, { ...props, locationUri });
  }
}

export type HostedConfigurationProfileProps = ConfigurationProfileBaseProps;

export class HostedConfigurationProfile extends ConfigurationProfile {
  constructor(scope: cdk.Construct, id: string, props: HostedConfigurationProfileProps) {
    const locationUri = 'hosted';
    super(scope, id, { ...props, locationUri });
  }
}
