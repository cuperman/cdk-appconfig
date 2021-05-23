import { expect as expectCDK, haveResource, ResourcePart } from '@aws-cdk/assert';
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
        name: 'My Deployment Strategy',
        deploymentDurationInMinutes: 0,
        growthFactor: 100
      });

      it('has a deployment strategy id', () => {
        expect(typeof strategy.deploymentStrategyId).toEqual('string');
      });

      it('creates a deployment strategy with required properties', () => {
        expectCDK(stack).to(
          haveResource('AWS::AppConfig::DeploymentStrategy', {
            Name: 'My Deployment Strategy',
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
        deploymentDurationInMinutes: 10,
        growthFactor: 2,
        finalBakeTimeInMinutes: 0,
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
        deploymentDurationInMinutes: 0,
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

    describe('fromPredefined', () => {
      const stack = buildCdkStack();
      const strategy = DeploymentStrategy.fromPredefined(
        stack,
        'PredefinedStrategy',
        PredefinedDeploymentStrategy.ALL_AT_ONCE
      );

      it('has a deployment strategy id', () => {
        expect(strategy.deploymentStrategyId).toEqual('AppConfig.AllAtOnce');
      });
    });

    describe('fromId', () => {
      it('has a deployment strategy id', () => {
        const stack = buildCdkStack();
        const strategy = DeploymentStrategy.fromId(stack, 'ImportedStrategy', 'abc123');

        expect(strategy.deploymentStrategyId).toEqual('abc123');
      });
    });
  });
});
