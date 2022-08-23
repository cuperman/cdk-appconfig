import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { IApplication } from './application';
import { IEnvironment } from './environment';
import { Validator } from './validator';

export interface IConfigurationProfile extends cdk.IResource {
  readonly configurationProfileId: string;
  readonly configurationProfileArn: string;
}

export interface ConfigurationProfileBaseProps {
  readonly application: IApplication;
  readonly name?: string;
  readonly validators?: Validator[];
  readonly description?: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export interface ConfigurationProfileProps extends ConfigurationProfileBaseProps {
  readonly locationUri: string;
}

export class ConfigurationProfile extends cdk.Resource implements IConfigurationProfile, cdk.ITaggable {
  public readonly application: IApplication;
  public readonly configurationProfileId: string;
  public readonly configurationProfileName: string;
  public readonly configurationProfileArn: string;
  public readonly tags: cdk.TagManager;
  private readonly resource: cdk.CfnResource;

  constructor(scope: Construct, id: string, props: ConfigurationProfileProps) {
    super(scope, id);

    const RESOURCE_TYPE = 'AWS::AppConfig::ConfigurationProfile';
    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.RETAIN;

    this.application = props.application;
    this.configurationProfileName = props.name || cdk.Names.uniqueId(this);
    this.tags = new cdk.TagManager(cdk.TagType.KEY_VALUE, RESOURCE_TYPE);

    const validatorConfigs = props.validators?.map((validator) => validator.bind(this));

    this.resource = new cdk.CfnResource(this, 'Resource', {
      type: RESOURCE_TYPE,
      properties: {
        ApplicationId: this.application.applicationId,
        Name: this.configurationProfileName,
        Description: props.description,
        LocationUri: props.locationUri,
        Validators: validatorConfigs?.map((config) => ({
          Type: config.validatorType,
          Content: config.content
        })),
        Tags: this.tags.renderedTags
      }
    });

    this.resource.applyRemovalPolicy(props.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.configurationProfileId = this.resource.ref;
    this.configurationProfileArn = `${this.application.applicationArn}/configurationprofile/${this.configurationProfileId}`;
  }

  public grantGetConfiguration(grantee: iam.IGrantable, environment?: IEnvironment): iam.Grant {
    // allow all environments by default
    const environments = environment ? environment.environmentId : '*';

    return iam.Grant.addToPrincipal({
      grantee,
      actions: ['appconfig:GetConfiguration'],
      resourceArns: [
        this.application.applicationArn,
        `${this.application.applicationArn}/environment/${environments}`,
        this.configurationProfileArn
      ]
    });
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
  constructor(scope: Construct, id: string, props: S3ConfigurationProfileProps) {
    const locationUri = props.s3Bucket.s3UrlForObject(props.s3ObjectKey);
    super(scope, id, { ...props, locationUri });
  }
}

export type HostedConfigurationProfileProps = ConfigurationProfileBaseProps;

export class HostedConfigurationProfile extends ConfigurationProfile {
  constructor(scope: Construct, id: string, props: HostedConfigurationProfileProps) {
    const locationUri = 'hosted';
    super(scope, id, { ...props, locationUri });
  }
}
