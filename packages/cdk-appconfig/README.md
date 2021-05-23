# CDK AppConfig

High-level CDK constructs for AWS AppConfig

## Overview

The primary constructs in AppConfig are the following:

- `Application`
- `ConfigurationProfile`
- `HostedConfigurationVersion`
- `Environment`
- `DeploymentStrategy`
- `Deployment`

See the [CloudFormation docs](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/AWS_AppConfig.html) for more info.

### Configuration Source Locations

Configuration profiles support multiple sources for the configuration content. The following constructs extend `ConfigurationProfile`, providing an easier way to define configuration sources.

- `SsmDocumentConfigurationProfile` _coming soon_ - Systems Manager (SSM) documents
- `SsmParameterConfigurationProfile` _coming soon_ - SSM Parameter Store parameters
- `S3ConfigurationProfile` - Amazon S3
- `HostedConfigurationProfile` - Hosted in AppConfig, allowing you to use `HostedConfigurationVersion` constructs to manage configuration content.

Here's in an example using S3 as a configuration source:

```ts
import * as s3 from '@aws-sdk/aws-s3';
import * as appconfig from '@cuperman/cdk-appconfig';

const configBucket = new s3.Bucket(this, 'ConfigBucket');

const app = new appconfig.Application(this, 'App', {
  name: 'My Application'
});

const configProfile = new appconfig.S3ConfigurationProfile(this, 'ConfigProfile', {
  application: app,
  name: 'My Configuration Profile',
  s3Bucket: configBucket,
  s3ObjectKey: 'path/to/config.json'
});
```

### Hosted Configurations

Using hosted configurations, configuration content can be managed with hosted configuration versions. Hosted configuration versions support plain text, json, or yaml formats, specified with ContentType. The CVontent of the configuration version can be defined inline, uploaded as a CDK asset, or imported from an S3 bucket.

Content type:

- `ContentType.TEXT`
- `ContentType.JSON`
- `ContentType.YAML`

Content:

- `Content.fromInline(content)`
- `Content.fromAsset(path)`
- `Content.fromBucket(bucket, key[, objectVersion])`

Example of using CDK assets to manage AppConfig hosted configurations:

```ts
import * as appconfig from '@cuperman/cdk-appconfig';

const app = new appconfig.Application(this, 'App', {
  name: 'My Application'
});

const configProfile = new appconfig.HostedConfigurationProfile(this, 'ConfigProfile', {
  application: app,
  name: 'My Configuration Profile'
});

new appconfig.HostedConfigurationVersion(this, 'ConfigVersion', {
  application: app,
  configurationProfile: configProfile,
  contentType: appconfig.ContentType.YAML,
  content: appconfig.Content.fromAsset(path.join(__dirname, 'config.yml'))
});
```

### Validating Configurations

AppConfig configuration profiles support validation on deployment. You can describe the validation rules using [JSON schema](https://json-schema.org), or with custom logic in a Lambda function. The json schema can be defined inline, uploaded as a CDK asset, or imported from an s3 bucket.

JSON schema validators:

- `JsonSchemaValidator.fromInline(schema)`
- `JsonSchemaValidator.fromAsset(path)` _coming soon_
- `JsonSchemaValidator.fromBucket(bucket, key[, objectVersion])` _coming soon_

Example defining inline JSON schema:

```ts
new appconfig.HostedConfigurationProfile(this, 'Config', {
  application: app,
  name: 'My Config',
  validators: [
    appconfig.JsonSchemaValidator.fromInline(`{
      "$schema": "http://json-schema.org/draft-04/schema#",
      "title": "$id$",
      "description": "BasicFeatureToggle-1",
      "type": "object",
      "additionalProperties": false,
      "patternProperties": {
        "[^\\s]+$": {
          "type": "boolean"
        }
      },
      "minProperties": 1
    }`)
  ]
});
```

Lambda validators:

- `LambdaValidator.fromLambdaFunction(lambdaFunction)`

Example using custom Lambda validator:

```ts
const validator = new lambda.Function(this, 'Validator', { ... });

new appconfig.HostedConfigurationProfile(this, 'Config', {
  application: app,
  name: 'My Config',
  validators: [
    appconfig.LambdaValidator.fromLambdaFunction(validator)
  ]
});
```

For more information about creating configuration validators, read this:
[https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-configuration-and-profile-validators.html](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-configuration-and-profile-validators.html)

### Deployments

Deploy your configuration versions to an environment using a deployment strategy. Here's an example:

```ts
import * as appconfig from '@cuperman/cdk-appconfig';

const app = new appconfig.Application( ... );
const configProfile = new appconfig.HostedConfigurationProfile( ... );
const configVersion = new appconfig.HostedConfigurationVersion( ... );

const env = new appconfig.Environment(this, 'Env', {
  name: 'Production'
});

const strategy = new appconfig.DeploymentStrategy(this, 'Stratey', {
  name: 'Exponential Rollout',
  growthType: appconfig.DeploymentStrategyGrowthType.EXPONENTIAL,
  growthFactor: 2,
  deploymentDurationInMinutes: 10,
  finalBakeTimeInMinutes: 0
});

new appconfig.Deployment(this, 'Deployment', {
  application: app,
  configurationProfile: configProfile,
  configurationVersionNumber: configVersion.versionNumber,
  environment: env,
  deploymentStrategy: strategy
});
```

Deployment strategies are global (not defined within your Application scope), so you may prefer to import them. You can import Deployment strategies that you created, or ones that are predefined by AppConfig.

- `DeploymentStrategy.fromId(deploymentStrategyId)`
- `DeploymentStrategy.fromPredefined(predefinedDeploymentStrategy)`

Example using a predefined deployment strategy:

```ts
new appconfig.Deployment(this, 'Deployment', {
  application: app,
  configurationProfile: configProfile,
  configurationVersionNumber: configVersion.versionNumber,
  environment: env,
  deploymentStrategy: appconfig.DeploymentStrategy.fromPredefined(
    appconfig.PredefinedDeploymentStrategy.LINEAR_50_PERCENT_EVERY_30_SECONDS
  )
});
```

### Monitors

_coming soon_

### Change Management

By default, applications, configuration profiles, and hosted configuration versions are retained on delete and update. This prevents previous versions from being deleted when updates to configuration versions are made, preserving the history. The application and configuration profiles need to be retained on delete because they may not be empty. Environments and deployment strategies are removed on delete.

The default behavior described above can be altered using the `removalPolicy` property one each AppConfig construct. Some examples are below.

```ts
const env = new appconfig.Environment(this, 'ProdEnv', {
  application: app,
  name: 'Production',
  removalPolicy: cdk.RemovalPolicy.RETAIN
});

const config = new appconfig.HostedConfigurationProfile(this, 'Config', {
  application: app,
  name: 'My Config',
  removalPolicy: cdk.RemovalPolicy.DESTROY
});

new appconfig.HostedConfigurationVersion(this, 'ConfigContent', {
  application: app,
  configurationProfile: config,
  contentType: appconfig.ContentType.YAML,
  content: appconfig.Content.fromAsset(path.join(__dirname, 'config.yml')),
  removalPolicy: cdk.RemovalPolicy.DESTROY
});
```

If you only want to create a configuration version on initial deployment, but plan to manage changes and subsequent deployments in the AppConfig UI, you can use the `initOnly` flag to prevent configuration changes from creating new versions on stack updates.

```ts
new appconfig.HostedConfigurationVersion(this, 'ConfigContent', {
  application: app,
  configurationProfile: config,
  contentType: appconfig.ContentType.YAML,
  content: appconfig.Content.fromAsset(path.join(__dirname, 'config.yml')),
  initOnly: true
});
```
