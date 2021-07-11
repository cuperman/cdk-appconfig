import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as actions from '@aws-cdk/aws-codepipeline-actions';
import * as iam from '@aws-cdk/aws-iam';

import * as appconfig from '@cuperman/cdk-appconfig';

// defined in aws-cdk/packages/@aws-cdk/aws-codepipeline-actions/lib/common.ts
function deployArtifactBounds(): codepipeline.ActionArtifactBounds {
  return {
    minInputs: 1,
    maxInputs: 1,
    minOutputs: 0,
    maxOutputs: 0
  };
}

export interface AppConfigDeployActionProps extends codepipeline.CommonAwsActionProps {
  readonly input: codepipeline.Artifact;

  readonly environment: appconfig.Environment;

  readonly configurationProfile: appconfig.IConfigurationProfile;

  readonly deploymentStrategy: appconfig.IDeploymentStrategy;

  readonly configurationPath: string;
}

export class AppConfigDeployAction extends actions.Action {
  private readonly props: AppConfigDeployActionProps;

  constructor(props: AppConfigDeployActionProps) {
    super({
      ...props,
      resource: props.environment,
      category: codepipeline.ActionCategory.DEPLOY,
      provider: 'AppConfig',
      artifactBounds: deployArtifactBounds(),
      inputs: [props.input]
    });

    this.props = props;
  }

  protected bound(
    _scope: cdk.Construct,
    _stage: codepipeline.IStage,
    options: codepipeline.ActionBindOptions
  ): codepipeline.ActionConfig {
    // the action needs to read the config from the bucket
    options.bucket.grantRead(options.role);

    // it may need to decrypt with this kms key
    if (options.bucket.encryptionKey) {
      options.bucket.encryptionKey.grantDecrypt(options.role);
    }

    // it needs access to be able to start a deployment on the environment
    this.props.environment.grantStartDeployment(options.role);

    // FIXME
    options.role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['appconfig:*'],
        resources: [
          `arn:${cdk.Aws.PARTITION}:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:application/*`,
          `arn:${cdk.Aws.PARTITION}:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:application/*/environment/*`,
          `arn:${cdk.Aws.PARTITION}:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:application/*/configurationprofile/*`,
          `arn:${cdk.Aws.PARTITION}:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:deploymentstrategy/*`,
          `arn:${cdk.Aws.PARTITION}:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:application/*/environment/*/deployment/*`,
          `arn:${cdk.Aws.PARTITION}:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:application/*/configurationprofile/*/hostedconfigurationversion/*`
        ]
      })
    );

    return {
      configuration: {
        Application: this.props.environment.application.applicationId,
        Environment: this.props.environment.environmentId,
        ConfigurationProfile: this.props.configurationProfile.configurationProfileId,
        DeploymentStrategy: this.props.deploymentStrategy.deploymentStrategyId,
        InputArtifactConfigurationPath: this.props.configurationPath
      }
    };
  }
}
