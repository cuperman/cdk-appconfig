import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';

import { Application } from './application';
import { Validator } from './validator';

export interface IConfigurationProfile extends cdk.IResource {
  readonly configurationProfileId: string;
}

export interface ConfigurationProfileProps {
  readonly application: Application;
  readonly name: string;
  readonly validators?: Validator[];
  readonly description?: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class HostedConfigurationProfile extends cdk.Resource implements IConfigurationProfile, cdk.ITaggable {
  public readonly configurationProfileId: string;
  public readonly tags: cdk.TagManager;
  private readonly resource: appconfig.CfnConfigurationProfile;

  constructor(scope: cdk.Construct, id: string, props: ConfigurationProfileProps) {
    super(scope, id, {
      physicalName: props.name
    });

    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.RETAIN;

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::ConfigurationProfile');

    const validatorConfigs = props.validators?.map((validator) => validator.bind(this));

    this.resource = new appconfig.CfnConfigurationProfile(this, 'Resource', {
      applicationId: props.application.applicationId,
      name: props.name,
      description: props.description,
      locationUri: 'hosted',
      validators: validatorConfigs
    });

    this.resource.applyRemovalPolicy(props.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.configurationProfileId = this.resource.ref;
  }

  protected prepare() {
    this.resource.tags = this.tags.renderTags();
  }
}
