import { anything, expect as expectCDK, haveResource, ResourcePart } from '@aws-cdk/assert';
import { buildCdkStack } from './helpers';
import * as cdk from '@aws-cdk/core';
import {
  DeploymentStrategy,
  DeploymentStrategyGrowthType,
  DeploymentStrategyReplication,
  PredefinedDeploymentStrategy
} from '../lib';

describe('AppConfig', () => {
  describe('DeploymentStrategy', () => {
    describe('with required props', () => {
      const stack = buildCdkStack();

      const strategy = new DeploymentStrategy(stack, 'MyDeploymentStrategy', {
        deploymentDuration: cdk.Duration.minutes(0),
        growthFactor: 100
      });

      it('has a deployment strategy id', () => {
        expect(typeof strategy.deploymentStrategyId).toEqual('string');
      });

      it('has a deployment strategy name', () => {
        expect(typeof strategy.deploymentStrategyName).toEqual('string');
      });

      it('has a deployment strategy arn', () => {
        expect(typeof strategy.deploymentStrategyArn).toEqual('string');
      });

      it('creates a deployment strategy with required properties', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::DeploymentStrategy', {
            Name: anything(),
            DeploymentDurationInMinutes: 0,
            GrowthFactor: 100,
            ReplicateTo: 'NONE'
          })
        );
      });

      it('deletes deployment strategies by default because no resources depend on them by default', () => {
        expectCDK(stack).to(
          haveResource(
            'AWS::AppConfig::DeploymentStrategy',
            {
              UpdateReplacePolicy: 'Delete',
              DeletionPolicy: 'Delete'
            },
            ResourcePart.CompleteDefinition
          )
        );
      });
    });

    describe('with optional props', () => {
      const stack = buildCdkStack();

      new DeploymentStrategy(stack, 'MyDeploymentStrategy', {
        name: 'Exponential rollout',
        description: 'Start small and roll out exponentially over 10 minutes',
        growthType: DeploymentStrategyGrowthType.EXPONENTIAL,
        deploymentDuration: cdk.Duration.minutes(10),
        growthFactor: 2,
        finalBakeTime: cdk.Duration.minutes(0),
        replicateTo: DeploymentStrategyReplication.SSM_DOCUMENT,
        removalPolicy: cdk.RemovalPolicy.RETAIN
      });

      it('creates a deployment strategy with optional properties', () => {
        expectCDK(stack).to(
          haveResource(
            'AWS::AppConfig::DeploymentStrategy',
            {
              Properties: {
                Name: 'Exponential rollout',
                Description: 'Start small and roll out exponentially over 10 minutes',
                GrowthType: 'EXPONENTIAL',
                DeploymentDurationInMinutes: 10,
                GrowthFactor: 2,
                FinalBakeTimeInMinutes: 0,
                ReplicateTo: 'SSM_DOCUMENT'
              },
              UpdateReplacePolicy: 'Retain',
              DeletionPolicy: 'Retain'
            },
            ResourcePart.CompleteDefinition
          )
        );
      });
    });

    describe('with tags', () => {
      const stack = buildCdkStack({ tags: { Foo: 'Bar', Kanye: 'West' } });

      new DeploymentStrategy(stack, 'MyDeploymentStrategy', {
        name: 'My Deployment Strategy',
        deploymentDuration: cdk.Duration.minutes(0),
        growthFactor: 100
      });

      it('applies tags', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::DeploymentStrategy', {
            Tags: [
              { Key: 'Foo', Value: 'Bar' },
              { Key: 'Kanye', Value: 'West' }
            ]
          })
        );
      });
    });

    describe('fromDeploymentStrategyId', () => {
      const stack = buildCdkStack();

      it('support predefined deployment strategies', () => {
        const strategy = DeploymentStrategy.fromDeploymentStrategyId(
          stack,
          'PredefinedStrategy',
          PredefinedDeploymentStrategy.ALL_AT_ONCE
        );
        expect(strategy.deploymentStrategyId).toEqual('AppConfig.AllAtOnce');
      });

      it('supports custom deployment strategies', () => {
        const strategy = DeploymentStrategy.fromDeploymentStrategyId(stack, 'ImportedStrategy1', 'abc123');
        expect(strategy.deploymentStrategyId).toEqual('abc123');
      });

      it('has a deployment strategy arn', () => {
        const strategy = DeploymentStrategy.fromDeploymentStrategyId(stack, 'ImportedStrategy2', 'def456');
        expect(strategy.deploymentStrategyArn).toMatch(/:deploymentstrategy\/def456/);
      });
    });
  });
});
