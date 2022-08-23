#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { HostedConfigurationStack, LambdaExtensionStack, CodePipelineStack } from '../lib';

const app = new cdk.App();

new HostedConfigurationStack(app, 'AppConfigExample-HostedConfiguration');

new LambdaExtensionStack(app, 'AppConfigExample-LambdaExtension');

new CodePipelineStack(app, 'AppConfigExample-CodePipeline');
