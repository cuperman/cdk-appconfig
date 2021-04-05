# CDK AppConfig

High-level CDK constructs for AWS AppConfig

## Example

```ts
import * as cdk from '@aws-cdk/core';
import * as appconfig from '@cuperman/cdk-appconfig';

class MyConfigStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const application = new appconfig.Application(this, 'MyApplication', {
      name: 'MyApp'
    });

    new appconfig.Environment(this, 'MyEnvironment', {
      application,
      name: 'MyEnv'
    });

    const configurationProfile = new appconfig.HostedConfigurationProfile(this, 'MyConfiguration', {
      application,
      name: 'MyConfig'
    });

    new appconfig.HostedConfigurationVersion(this, 'MyHostedConfigurationVersion', {
      application,
      configurationProfile,
      contentType: appconfig.HostedConfigurationContentType.TEXT,
      content: 'My hosted configuration content'
    });
  }
}
```
