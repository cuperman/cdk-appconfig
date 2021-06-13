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

export function buildApplication(
  scope: cdk.Construct,
  id: string,
  options?: { name?: string }
): appconfig.IApplication {
  return new appconfig.Application(scope, id, {
    name: options?.name || 'MyApplication'
  });
}

export function buildHostedProfile(
  scope: cdk.Construct,
  options?: { application?: appconfig.IApplication; name?: string }
): appconfig.IConfigurationProfile {
  return new appconfig.HostedConfigurationProfile(scope, 'MyHostedConfigurationProfile', {
    application: options?.application || buildApplication(scope, 'MyApplication'),
    name: options?.name || 'MyHostedConfigurationProfile'
  });
}

export function buildEnvironment(
  scope: cdk.Construct,
  id: string,
  options?: { application?: appconfig.IApplication; name?: string }
): appconfig.IEnvironment {
  return new appconfig.Environment(scope, id, {
    application: options?.application || buildApplication(scope, 'MyApplication'),
    name: options?.name || 'MyEnvironment'
  });
}

export function buildDeploymentStrategy(
  scope: cdk.Construct,
  options?: { name?: string; deploymentDurationInMinutes?: number; growthFactor?: number }
): appconfig.IDeploymentStrategy {
  return new appconfig.DeploymentStrategy(scope, 'MyDeploymentStrategy', {
    name: options?.name || 'MyDeploymentStrategy',
    deploymentDurationInMinutes: options?.deploymentDurationInMinutes || 0,
    growthFactor: options?.growthFactor || 0
  });
}
