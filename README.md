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

You can create inline config content:

```ts
new appconfig.HostedConfigurationVersion(this, 'InlineContent', {
  application: app,
  configurationProfile: config,
  contentType: appconfig.ContentType.TEXT,
  content: appconfig.Content.fromInline('Hello, World')
});
```

Or import configurations from s3 buckets:

```ts
const configBucket = s3.Bucket.fromName('my-config-bucket');

new appconfig.HostedConfigurationVersion(this, 'InlineContent', {
  application: app,
  configurationProfile: config,
  contentType: appconfig.ContentType.JSON,
  content: appconfig.Content.fromBucket(configBucket, 'config.json')
});
```
