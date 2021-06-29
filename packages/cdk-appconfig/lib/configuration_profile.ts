import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as ssm from '@aws-cdk/aws-ssm';

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
  readonly retrievalRoleArn?: string;
}

export class ConfigurationProfile extends cdk.Resource implements IConfigurationProfile, cdk.ITaggable {
  public readonly application: IApplication;
  public readonly configurationProfileId: string;
  public readonly configurationProfileName: string;
  public readonly configurationProfileArn: string;
  public readonly tags: cdk.TagManager;
  protected readonly resource: appconfig.CfnConfigurationProfile;

  constructor(scope: cdk.Construct, id: string, props: ConfigurationProfileProps) {
    super(scope, id);

    const DEFAULT_REMOVAL_POLICY = cdk.RemovalPolicy.RETAIN;

    this.application = props.application;
    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::ConfigurationProfile');

    const validatorConfigs = props.validators?.map((validator) => validator.bind(this));

    this.resource = new appconfig.CfnConfigurationProfile(this, 'Resource', {
      applicationId: this.application.applicationId,
      name: props.name || cdk.Names.uniqueId(this),
      description: props.description,
      locationUri: props.locationUri,
      validators: validatorConfigs?.map((config) => ({ ...config, type: config.validatorType }))
    });

    this.resource.applyRemovalPolicy(props.removalPolicy || DEFAULT_REMOVAL_POLICY);

    this.configurationProfileId = this.resource.ref;
    this.configurationProfileName = this.resource.name;
    this.configurationProfileArn = `${this.application.applicationArn}/configurationprofile/${this.configurationProfileId}`;
  }

  protected prepare() {
    this.resource.tags = this.tags.renderTags();
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

export interface SsmDocumentConfigurationProfileProps extends ConfigurationProfileBaseProps {
  readonly ssmDocument: ssm.CfnDocument;
}

export class SsmDocumentConfigurationProfile extends ConfigurationProfile {
  constructor(scope: cdk.Construct, id: string, props: SsmDocumentConfigurationProfileProps) {
    const ssmDocumentName = props.ssmDocument.ref;
    const ssmDocumentArn = `arn:${cdk.Aws.PARTITION}:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:document/${ssmDocumentName}`;
    const locationUri = ssmDocumentArn;
    super(scope, id, { ...props, locationUri });

    const retrievalRole = new iam.Role(this, 'RetrievalRole', {
      assumedBy: new iam.ServicePrincipal('appconfig.amazonaws.com')
    });

    const retrievalPolicy = new iam.Policy(this, 'RetrievalPolicy', {
      roles: [retrievalRole],
      statements: [
        new iam.PolicyStatement({
          actions: ['ssm:GetDocument'],
          resources: [ssmDocumentArn]
        })
      ]
    });

    this.resource.retrievalRoleArn = retrievalRole.roleArn;
    this.resource.addDependsOn(retrievalPolicy.node.defaultChild as iam.CfnPolicy);
  }
}

export interface SsmParameterConfigurationProfileProps extends ConfigurationProfileBaseProps {
  readonly ssmParameter: ssm.IParameter;
}

export class SsmParameterConfigurationProfile extends ConfigurationProfile {
  constructor(scope: cdk.Construct, id: string, props: SsmParameterConfigurationProfileProps) {
    const locationUri = props.ssmParameter.parameterArn;
    super(scope, id, { ...props, locationUri });

    const retrievalRole = new iam.Role(this, 'RetrievalRole', {
      assumedBy: new iam.ServicePrincipal('appconfig.amazonaws.com')
    });

    const retrievalPolicy = new iam.Policy(this, 'RetrievalPolicy', {
      roles: [retrievalRole],
      statements: [
        new iam.PolicyStatement({
          actions: ['ssm:GetParameter'],
          resources: [props.ssmParameter.parameterArn]
        })
      ]
    });

    this.resource.retrievalRoleArn = retrievalRole.roleArn;
    this.resource.addDependsOn(retrievalPolicy.node.defaultChild as iam.CfnPolicy);
  }
}

export interface S3ConfigurationProfileProps extends ConfigurationProfileBaseProps {
  readonly s3Bucket: s3.IBucket;
  readonly s3ObjectKey: string;
}

export class S3ConfigurationProfile extends ConfigurationProfile {
  constructor(scope: cdk.Construct, id: string, props: S3ConfigurationProfileProps) {
    const locationUri = props.s3Bucket.s3UrlForObject(props.s3ObjectKey);
    super(scope, id, { ...props, locationUri });

    const retrievalRole = new iam.Role(this, 'RetrievalRole', {
      assumedBy: new iam.ServicePrincipal('appconfig.amazonaws.com')
    });

    const retrievalPolicy = new iam.Policy(this, 'RetrievalPolicy', {
      roles: [retrievalRole],
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:GetObject', 's3:GetObjectVersion'],
          resources: [props.s3Bucket.arnForObjects(props.s3ObjectKey)]
        }),
        new iam.PolicyStatement({
          actions: ['s3:GetBucketLocation', 's3:GetBucketVersioning', 's3:ListBucketVersions', 's3:ListBucket'],
          resources: [props.s3Bucket.bucketArn]
        }),
        new iam.PolicyStatement({
          actions: ['s3:ListAllMyBuckets'],
          resources: ['*']
        })
      ]
    });

    this.resource.retrievalRoleArn = retrievalRole.roleArn;
    this.resource.addDependsOn(retrievalPolicy.node.defaultChild as iam.CfnPolicy);
  }
}

export type HostedConfigurationProfileProps = ConfigurationProfileBaseProps;

export class HostedConfigurationProfile extends ConfigurationProfile {
  constructor(scope: cdk.Construct, id: string, props: HostedConfigurationProfileProps) {
    const locationUri = 'hosted';
    super(scope, id, { ...props, locationUri });
  }
}
