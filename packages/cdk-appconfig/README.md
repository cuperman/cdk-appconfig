# CDK AppConfig

High-level CDK constructs for AWS AppConfig

## Example

```ts
import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import * as appconfig from '@cuperman/cdk-appconfig';

class MyConfigStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const app = new appconfig.Application(this, 'App', {
      name: 'My Application'
    });

    const env = new appconfig.Environment(this, 'ProdEnv', {
      application: app,
      name: 'Production'
    });

    const config = new appconfig.HostedConfigurationProfile(this, 'Config', {
      application: app,
      name: 'My Config'
    });

    new appconfig.HostedConfigurationVersion(this, 'ConfigContent', {
      application: app,
      configurationProfile: config,
      contentType: appconfig.ContentType.YAML,
      content: appconfig.Content.fromAsset(path.join(__dirname, 'config.yml'))
    });
  }
}
```

### Content

You can create inline config content:

```ts
new appconfig.HostedConfigurationVersion(this, 'InlineContent', {
  application: app,
  configurationProfile: config,
  contentType: appconfig.ContentType.TEXT,
  content: appconfig.Content.fromInline('Hello, World')
});
```

Or upload a local configuration file as an asset:

```ts
new appconfig.HostedConfigurationVersion(this, 'AssetContent', {
  application: app,
  configurationProfile: config,
  contentType: appconfig.ContentType.JSON,
  content: appconfig.Content.fromAsset(path.join(__dirname, 'config.yml'))
});
```

Or import a configuration from an s3 bucket:

```ts
const configBucket = s3.Bucket.fromName('my-config-bucket');

new appconfig.HostedConfigurationVersion(this, 'InlineContent', {
  application: app,
  configurationProfile: config,
  contentType: appconfig.ContentType.JSON,
  content: appconfig.Content.fromBucket(configBucket, 'config.json')
});
```

### Validation

You can use [JSON schema](https://json-schema.org/) or a custom lambda function as a validator for your configurations.

Define JSON schema inline on a configuration profile:

```ts
new appconfig.HostedConfigurationProfile(this, 'Config', {
  application: app,
  name: 'My Config',
  validators: [
    appconfig.JsonSchemaValidator.fromInline(`{
      "$schema": "http://json-schema.org/draft/2019-09/schema#",
      "type":"object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string" },
        "age": { "type": "number" }
      },
      "required": [ "email" ]
    }`)
  ]
});
```

Or you can create a custom validator with a lambda function:

```ts
const configValidator = new lambda.Function(this, 'ConfigValidator', {
  // ...
});

new appconfig.HostedConfigurationProfile(this, 'Config', {
  application: app,
  name: 'My Config',
  validators: [appconfig.LambdaValidator.fromLambdaFunction(configValidator)]
});
```

Read more about AWS AppConfig validators here: [https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-configuration-and-profile-validators.html](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-configuration-and-profile-validators.html)

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

## Releasing / Publishing

```bash
# bump version and tag
yarn version --minor
git push --tags

# build the release package
yarn build
yarn test
yarn package

# publish the package to Github Packages
npm publish ./pkg/js/cdk-appconfig@X.X.X.jsii.tgz
```
