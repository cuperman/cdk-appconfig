#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HostedConfigurationStack, LambdaExtensionStack } from '../lib';

const app = new cdk.App();

new HostedConfigurationStack(app, 'AppConfigExample-HostedConfiguration');

new LambdaExtensionStack(app, 'AppConfigExample-LambdaExtension');
