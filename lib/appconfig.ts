import * as cdk from '@aws-cdk/core';
import * as appconfig from '@aws-cdk/aws-appconfig';

export interface IApplication extends cdk.IResource {
  readonly applicationId: string;
}

export interface ApplicationProps {
  readonly name: string;
  readonly description?: string;
}

export class Application extends cdk.Resource implements IApplication, cdk.ITaggable {
  public readonly applicationId: string;
  public readonly tags: cdk.TagManager;
  private readonly resource: appconfig.CfnApplication;

  constructor(scope: cdk.Construct, id: string, props: ApplicationProps) {
    super(scope, id, {
      physicalName: props.name
    });

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::Application');

    this.resource = new appconfig.CfnApplication(this, 'Resource', {
      name: props.name,
      description: props.description
    });

    this.applicationId = this.resource.ref;
  }

  prepare() {
    this.resource.tags = this.tags.renderTags();
  }
}

export interface IConfigurationProfile extends cdk.IResource {
  readonly configurationProfileId: string;
}

export interface ConfigurationProfileProps {
  readonly application: Application;
  readonly name: string;
  readonly description?: string;
}

export class HostedConfigurationProfile extends cdk.Resource implements IConfigurationProfile, cdk.ITaggable {
  public configurationProfileId: string;
  public tags: cdk.TagManager;
  private resource: appconfig.CfnConfigurationProfile;

  constructor(scope: cdk.Construct, id: string, props: ConfigurationProfileProps) {
    super(scope, id, {
      physicalName: props.name
    });

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::ConfigurationProfile');

    this.resource = new appconfig.CfnConfigurationProfile(this, 'Resource', {
      applicationId: props.application.applicationId,
      name: props.name,
      description: props.description,
      locationUri: 'hosted'
      // todo: validators
      // validators: [],
    });

    this.configurationProfileId = this.resource.ref;
  }

  prepare() {
    this.resource.tags = this.tags.renderTags();
  }
}

// TODO
// export class Deployment {}

// TODO
// export class DeploymentStrategy {}

export interface EnvironmentProps {
  readonly application: Application;
  readonly name: string;
  readonly description?: string;
}

export class Environment extends cdk.Resource implements cdk.ITaggable {
  public readonly environmentId: string;
  public readonly tags: cdk.TagManager;
  private readonly resource: appconfig.CfnEnvironment;

  constructor(scope: cdk.Construct, id: string, props: EnvironmentProps) {
    super(scope, id, {
      physicalName: props.name
    });

    this.tags = new cdk.TagManager(cdk.TagType.STANDARD, 'AWS::AppConfig::Environment');

    this.resource = new appconfig.CfnEnvironment(this, 'Resource', {
      applicationId: props.application.applicationId,
      name: props.name,
      description: props.description
      // TODO: monitors
      // monitors: []
    });

    this.environmentId = this.resource.ref;
  }

  prepare() {
    this.resource.tags = this.tags.renderTags();
  }
}

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
