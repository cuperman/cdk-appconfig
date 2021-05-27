import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';

import { Application } from './application';

export interface EnvironmentProps {
  readonly application: Application;
  readonly name?: string;
  readonly description?: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class Environment extends cdk.Resource implements cdk.ITaggable {
  public readonly environmentId: string;
  public readonly tags: cdk.TagManager;
  private readonly resource: appconfig.CfnEnvironment;

  constructor(scope: cdk.Construct, id: string, props: EnvironmentProps) {
    super(scope, id);

    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.DESTROY;

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::Environment');

    this.resource = new appconfig.CfnEnvironment(this, 'Resource', {
      applicationId: props.application.applicationId,
      name: props.name || cdk.Names.uniqueId(this),
      description: props.description
      // TODO: monitors
      // monitors: []
    });

    this.resource.applyRemovalPolicy(props.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.environmentId = this.resource.ref;
  }

  protected prepare() {
    this.resource.tags = this.tags.renderTags();
  }
}
