import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface IApplication extends cdk.IResource {
  readonly applicationId: string;
  readonly applicationArn: string;
}

export interface ApplicationProps {
  readonly name?: string;
  readonly description?: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class Application extends cdk.Resource implements IApplication, cdk.ITaggable {
  public readonly applicationId: string;
  public readonly applicationArn: string;
  public readonly applicationName: string;
  public readonly tags: cdk.TagManager;
  private readonly resource: cdk.CfnResource;

  constructor(scope: Construct, id: string, props?: ApplicationProps) {
    super(scope, id);

    const RESOURCE_TYPE = 'AWS::AppConfig::Application';
    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.RETAIN;

    this.applicationName = props?.name || cdk.Names.uniqueId(this);
    this.tags = new cdk.TagManager(cdk.TagType.KEY_VALUE, RESOURCE_TYPE);

    this.resource = new cdk.CfnResource(this, 'Resource', {
      type: RESOURCE_TYPE,
      properties: {
        Name: this.applicationName,
        Description: props?.description,
        Tags: this.tags.renderedTags
      }
    });

    this.resource.applyRemovalPolicy(props?.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.applicationId = this.resource.ref;
    this.applicationArn = `arn:${cdk.Aws.PARTITION}:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:application/${this.applicationId}`;
  }
}
