/*
 * Reference: https://aws.amazon.com/blogs/mt/automating-feature-release-using-aws-appconfig-integration-with-aws-codepipeline/
 */

import * as cdk from '@aws-cdk/core';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as actions from '@aws-cdk/aws-codepipeline-actions';

import * as appconfig from '@cuperman/cdk-appconfig';
import * as moreActions from '@cuperman/cdk-codepipeline-actions';

export class CodePipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipelineName = 'ListServicesCodePipelineConfigProfile';

    const app = new appconfig.Application(this, 'App', {
      name: 'ListServices',
      description: 'Configuration management for List-services application'
    });

    const devEnv = new appconfig.Environment(this, 'DevEnv', {
      application: app,
      name: 'development'
    });

    const testEnv = new appconfig.Environment(this, 'TestEnv', {
      application: app,
      name: 'testing'
    });

    const prodEnv = new appconfig.Environment(this, 'ProdEnv', {
      application: app,
      name: 'production'
    });

    const profile = new appconfig.CodePipelineConfigurationProfile(this, 'Profile', {
      application: app,
      pipelineName,
      validators: [
        appconfig.JsonSchemaValidator.fromInline(`
          {
            "$schema": "http://json-schema.org/draft-04/schema#",
              "description": "AppConfig Validator example",
                "type": "object",
                  "properties": {
              "boolEnableLimitResults": {
                "type": "boolean"
              },
              "intResultLimit": {
                "type": "number"
              }
            },
            "minProperties": 2,
              "required": [
                "intResultLimit",
                "boolEnableLimitResults"
              ]
          }
        `)
      ]
    });

    const strategy = new appconfig.DeploymentStrategy(this, 'Strategy', {
      growthFactor: 100,
      deploymentDuration: cdk.Duration.minutes(0),
      finalBakeTime: cdk.Duration.minutes(0)
    });

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName
    });

    const sourceOutput = new codepipeline.Artifact();

    const repo = new codecommit.Repository(this, 'Repo', {
      repositoryName: 'ListServices'
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new actions.CodeCommitSourceAction({
          actionName: 'Source',
          repository: repo,
          branch: 'main',
          output: sourceOutput
        })
      ]
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new moreActions.AppConfigDeployAction({
          runOrder: 1,
          actionName: 'Deploy-development',
          input: sourceOutput,
          environment: devEnv,
          configurationProfile: profile,
          deploymentStrategy: strategy,
          configurationPath: 'config/configdoc.json'
        }),
        new moreActions.AppConfigDeployAction({
          runOrder: 2,
          actionName: 'Deploy-testing',
          input: sourceOutput,
          environment: testEnv,
          configurationProfile: profile,
          deploymentStrategy: strategy,
          configurationPath: 'config/configdoc.json'
        }),
        new moreActions.AppConfigDeployAction({
          runOrder: 3,
          actionName: 'Deploy-production',
          input: sourceOutput,
          environment: prodEnv,
          configurationProfile: profile,
          deploymentStrategy: strategy,
          configurationPath: 'config/configdoc.json'
        })
      ]
    });
  }
}
