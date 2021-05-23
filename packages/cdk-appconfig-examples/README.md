# CDK AppConfig Examples

## Try it!

```bash
# register the @cuperman scope to resolve dependencies with Github Packages
$ npm login --registry=https://npm.pkg.github.com --scope=@cuperman

# list the available stacks
$ npx aws-cdk list --app "npx @cuperman/cdk-appconfig-examples"
ExampleHostedConfiguration

# synthesize a stack (create CloudFormation template)
$ npx aws-cdk synth --app "npx @cuperman/cdk-appconfig-examples" ExampleHostedConfiguration > template.yml

# deploy an example to your AWS account
$ npx aws-cdk deploy --app "npx @cuperman/cdk-appconfig-examples" ExampleHostedConfiguration
```

## Development

Useful commands:

- `yarn build` compile typescript to js
- `yarn watch` watch for changes and compile
- `yarn test` perform the jest unit tests
- `yarn cdk list` lists available CDK stacks to synthesize or deploy
- `yarn cdk synth` emits the synthesized CloudFormation template
- `yarn cdk diff` compare deployed stack with current state
- `yarn cdk deploy` deploy this stack to your default AWS account/region
