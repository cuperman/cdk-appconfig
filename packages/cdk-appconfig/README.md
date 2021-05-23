# CDK AppConfig

High-level CDK constructs for AWS AppConfig

## Overview

### Configuration Locations

- `new appconfig.SsmDocumentConfigurationProfile(scope, id, props)` _coming soon_
- `new appconfig.SsmParameterConfigurationProfile(scope, id, props)` _coming soon_
- `new appconfig.S3ConfigurationProfile(scope, id, props)`
- `new appconfig.HostedConfigurationProfile(scope, id, props)`

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

Content type:

- `appconfig.ContentType.TEXT`
- `appconfig.ContentType.JSON`
- `appconfig.ContentType.YAML`

Content:

- `appconfig.Content.fromInline(content)`
- `appconfig.Content.fromAsset(path)`
- `appconfig.Content.fromBucket(bucket, key[, objectVersion])`

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

JSON schema validators:

- `appconfig.JsonSchemaValidator.fromInline(schema)`
- `appconfig.JsonSchemaValidator.fromAsset(path)` _coming soon_
- `appconfig.JsonSchemaValidator.fromBucket(bucket, key[, objectVersion])` _coming soon_

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

Read more about JSON schema here: [https://json-schema.org](https://json-schema.org)

Lambda validators:

- `appconfig.LambdaValidator.fromLambdaFunction(lambdaFunction)`

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

Read more about AWS AppConfig validators here: [https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-configuration-and-profile-validators.html](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-configuration-and-profile-validators.html)

### Deployments

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

Use existing strategies:

- `appconfig.DeploymentStrategy.fromPredefined(predefinedDeploymentStrategy)`
- `appconfig.DeploymentStrategy.fromId(deploymentStrategyId)`

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

Coming soon...

### Change Management

By default, applications, configuration profiles, and hosted configuration versions are retained on delete and update. This prevents previous versions from being deleted when updates to configuration versions are made, preserving the history. The application and configuration profiles need to be retain because they may not be empty on delete. The environment is the only resource that is removed on delete.

You can alter the behavior by setting the removal policy on any AppConfig resource:

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

If you only want to initialize a configuration version on initial deployment, you can use `initOnly` flag to prevent configuration changes from creating new versions on stack updates.

```ts
new appconfig.HostedConfigurationVersion(this, 'ConfigContent', {
  application: app,
  configurationProfile: config,
  contentType: appconfig.ContentType.YAML,
  content: appconfig.Content.fromAsset(path.join(__dirname, 'config.yml')),
  initOnly: true
});
```
