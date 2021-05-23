import * as cdk from '@aws-cdk/core';
import * as appconfig from '../lib';

interface Tags {
  [key: string]: string;
}

export function buildCdkApp() {
  return new cdk.App();
}

export function buildCdkStack(options?: { tags?: Tags }) {
  const app = buildCdkApp();
  const stack = new cdk.Stack(app, 'MyStack', { tags: options?.tags });

  if (options?.tags) {
    Object.entries(options.tags).forEach(([key, value]) => {
      cdk.Tags.of(stack).add(key, value);
    });
  }

  return stack;
}

export function buildApplication(scope: cdk.Construct, options?: { name?: string }) {
  return new appconfig.Application(scope, 'MyApplication', {
    name: options?.name || 'MyApplication'
  });
}

export function buildHostedProfile(
  scope: cdk.Construct,
  options?: { application?: appconfig.Application; name?: string }
) {
  return new appconfig.HostedConfigurationProfile(scope, 'MyHostedConfigurationProfile', {
    application: options?.application || buildApplication(scope),
    name: options?.name || 'MyHostedConfigurationProfile'
  });
}

export function buildEnvironment(
  scope: cdk.Construct,
  options?: { application?: appconfig.Application; name?: string }
) {
  return new appconfig.Environment(scope, 'MyEnvironment', {
    application: options?.application || buildApplication(scope),
    name: options?.name || 'MyEnvironment'
  });
}

export function buildDeploymentStrategy(
  scope: cdk.Construct,
  options?: { name?: string; deploymentDurationInMinutes?: number; growthFactor?: number }
) {
  return new appconfig.DeploymentStrategy(scope, 'MyDeploymentStrategy', {
    name: options?.name || 'MyDeploymentStrategy',
    deploymentDurationInMinutes: options?.deploymentDurationInMinutes || 0,
    growthFactor: options?.growthFactor || 0
  });
}
