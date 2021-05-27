import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';

export interface IApplication extends cdk.IResource {
  readonly applicationId: string;
}

export interface ApplicationProps {
  readonly name?: string;
  readonly description?: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class Application extends cdk.Resource implements IApplication, cdk.ITaggable {
  public readonly applicationId: string;
  public readonly tags: cdk.TagManager;
  private readonly resource: appconfig.CfnApplication;

  constructor(scope: cdk.Construct, id: string, props?: ApplicationProps) {
    super(scope, id);

    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.RETAIN;

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::Application');

    this.resource = new appconfig.CfnApplication(this, 'Resource', {
      name: props?.name || cdk.Names.uniqueId(this),
      description: props?.description
    });

    this.resource.applyRemovalPolicy(props?.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.applicationId = this.resource.ref;
  }

  protected prepare() {
    this.resource.tags = this.tags.renderTags();
  }
}
