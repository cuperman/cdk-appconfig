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

const app = new appconfig.Application(this, 'App');

const configProfile = new appconfig.S3ConfigurationProfile(this, 'ConfigProfile', {
  application: app,
  s3Bucket: configBucket,
  s3ObjectKey: 'path/to/config.json'
});
```

### Hosted Configurations

Using hosted configurations, configuration content can be managed with hosted configuration versions. Hosted configuration versions support plain text, json, or yaml formats, specified with ContentType. The Content of the configuration version can be defined inline, uploaded as a CDK asset, or imported from an S3 bucket.

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

const app = new appconfig.Application(this, 'App');

const configProfile = new appconfig.HostedConfigurationProfile(this, 'ConfigProfile', {
  application: app
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
  validators: [
    appconfig.LambdaValidator.fromLambdaFunction(validator)
  ]
});
```

For more information about creating configuration validators, read this:
[https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-configuration-and-profile-validators.html](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-configuration-and-profile-validators.html)

### Accessing Configurations

Grant any grantable object access to get configurations by using the `grantGetConfiguration` method on a ConfigurationProfile object. Since configurations are not associated to an environment, access to all environments is granted unless a specific environment is passed as an argument (optional).

```ts
const app = new appconfig.Application( ... );
const env = new appconfig.Environment( ... );
const config = new appconfig.HostedConfigurationProfile( ... );

// grant access to get configurations from config on any environment
config.grantGetConfiguration(grantable);

// grant access to get configurations from config on a specific environment
config.grantGetConfiguration(grantable, env);
```

### Deployments

Deploy your configuration versions to an environment using a deployment strategy. Here's an example:

```ts
import * as appconfig from '@cuperman/cdk-appconfig';

const app = new appconfig.Application( ... );
const configProfile = new appconfig.HostedConfigurationProfile( ... );
const configVersion = new appconfig.HostedConfigurationVersion( ... );

const prodEnv = new appconfig.Environment(this, 'ProdEnv');

const exponentialStrategy = new appconfig.DeploymentStrategy(
  this,
  'ExponentialStrategy',
  {
    growthType: appconfig.DeploymentStrategyGrowthType.EXPONENTIAL,
    growthFactor: 2,
    deploymentDuration: cdk.Duration.minutes(10),
    finalBakeTime: cdk.Duration.minutes(0)
  }
);

prodEnv.addDeployment({
  configurationProfile: configProfile,
  configurationVersionNumber: configVersion.versionNumber,
  deploymentStrategy: exponentialStrategy
});
```

Deployment strategies are global (not defined within your Application scope), so you may prefer to import them. You can import Deployment strategies that you created, or ones that are predefined by AppConfig.

- `DeploymentStrategy.fromDeploymentStrategyId(deploymentStrategyId)`

Example using a predefined deployment strategy:

```ts
prodEnv.addDeployment({
  configurationProfile: configProfile,
  configurationVersionNumber: configVersion.versionNumber,
  deploymentStrategy: appconfig.DeploymentStrategy.fromDeploymentStrategyId(
    appconfig.PredefinedDeploymentStrategy.LINEAR_50_PERCENT_EVERY_30_SECONDS
  )
});
```

The `Environment.addDeployment` method implicitly creates dependencies for each deployment to ensure they run in order, serially. Only one Deployment can run concurrently per Environment in AppConfig.

### Alarms

Add alarms to your environment to automatically roll back configurations when unexpected issues occur.

```ts
const app = new appconfig.Application( ... );
const env = new appconfig.Environment( ... );
const config = new appconfig.HostedConfigurationProfile( ... );

// example lambda function that gets configuration from appconfig
const fn = new lambda.Function( ... );

// create an alarm from the lambda metric, and add it to the environment
env.addAlarm(
  fn.metricErrors().createAlarm(this, 'FnErrorAlarm', {
    threshold: 100,
    evaluationPeriods: 2
  });
);

// grant lambda function getConfiguration access in all environments to avoid
// circular dependencies
config.grantGetConfiguration(fn);
```

### Lambda Extensions

Use `LambdaExtensionLayer` class to add the lambda extension to any lambda function as a lambda layer. And don't forget to grant access for the lambda function to read configurations.

```ts
const app = new appconfig.Application( ... );
const env = new appconfig.Environment( ... );
const config = new appconfig.HostedConfigurationProfile( ... );

const fn = new lambda.Function( ... );

// add the lambda extension layer
fn.addLayers(
  new appconfig.LambdaExtensionLayer(this, 'AppConfigLambdaExtension')
);

// grant access to get configurations
config.grantGetConfiguration(fn, env);
```

For more info on AppConfig lambda extensions, see [https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions.html](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions.html)

### Change Management

By default, applications, configuration profiles, and hosted configuration versions are retained on delete and update. This prevents previous versions from being deleted when updates to configuration versions are made, preserving the history. The application and configuration profiles need to be retained on delete because they may not be empty. Environments and deployment strategies are removed on delete.

The default behavior described above can be altered using the `removalPolicy` property one each AppConfig construct. Some examples are below.

```ts
const prodEnv = new appconfig.Environment(this, 'ProdEnv', {
  application: app,
  removalPolicy: cdk.RemovalPolicy.RETAIN
});

const config = new appconfig.HostedConfigurationProfile(this, 'Config', {
  application: app,
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
