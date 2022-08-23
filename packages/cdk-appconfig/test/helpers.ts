import * as cdk from 'aws-cdk-lib';
import * as appconfig from '../lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

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

export function buildApplication(scope: Construct, id: string, options?: { name?: string }): appconfig.IApplication {
  return new appconfig.Application(scope, id, {
    name: options?.name || 'MyApplication'
  });
}

export function buildHostedProfile(
  scope: Construct,
  options?: { application?: appconfig.IApplication; name?: string }
): appconfig.IConfigurationProfile {
  return new appconfig.HostedConfigurationProfile(scope, 'MyHostedConfigurationProfile', {
    application: options?.application || buildApplication(scope, 'MyApplication'),
    name: options?.name || 'MyHostedConfigurationProfile'
  });
}

export function buildEnvironment(
  scope: Construct,
  id: string,
  options?: { application?: appconfig.IApplication; name?: string }
): appconfig.IEnvironment {
  return new appconfig.Environment(scope, id, {
    application: options?.application || buildApplication(scope, 'MyApplication'),
    name: options?.name || 'MyEnvironment'
  });
}

export function buildDeploymentStrategy(
  scope: Construct,
  options?: { name?: string; deploymentDuration?: cdk.Duration; growthFactor?: number }
): appconfig.IDeploymentStrategy {
  return new appconfig.DeploymentStrategy(scope, 'MyDeploymentStrategy', {
    name: options?.name || 'MyDeploymentStrategy',
    deploymentDuration: options?.deploymentDuration || cdk.Duration.minutes(0),
    growthFactor: options?.growthFactor || 0
  });
}

export function buildAlarm(scope: Construct): cloudwatch.IAlarm {
  return new cloudwatch.Alarm(scope, 'Alarm', {
    metric: new cloudwatch.Metric({
      namespace: 'namespace',
      metricName: 'metric'
    }),
    threshold: 100,
    evaluationPeriods: 2
  });
}
