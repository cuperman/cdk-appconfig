#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {
  HostedConfigurationStack,
  LambdaExtensionStack,
  S3ConfigurationStack,
  SsmDocumentConfigurationStack,
  SsmParameterConfigurationStack
} from '../lib';

const app = new cdk.App();

new HostedConfigurationStack(app, 'AppConfigExample-HostedConfiguration');

new LambdaExtensionStack(app, 'AppConfigExample-LambdaExtension');

new S3ConfigurationStack(app, 'AppConfigExample-S3Configuration');

new SsmDocumentConfigurationStack(app, 'AppConfigExample-SsmDocumentConfiguration');

new SsmParameterConfigurationStack(app, 'AppConfigExample-SsmParameterConfiguration');
