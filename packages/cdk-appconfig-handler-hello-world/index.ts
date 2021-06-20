/*
 * Reference: https://aws.amazon.com/blogs/mt/introducing-aws-appconfig-lambda-extension-deploying-application-configuration-serverless/
 */

import * as http from 'http';

function requireEnvironmentVariable(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (typeof value !== 'undefined') {
    return value;
  } else if (typeof defaultValue !== 'undefined') {
    return defaultValue;
  }

  throw new Error(`Environment variable "${name}" required`);
}

async function fetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
          data += chunk;
        });

        resp.on('end', () => {
          resolve(data);
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

async function getConfiguredNumberOf(configurationType: string, defaultValue: number): Promise<number> {
  const applicationName = requireEnvironmentVariable('AWS_APPCONFIG_APPLICATION_NAME');
  const environmentName = requireEnvironmentVariable('AWS_APPCONFIG_ENVIRONMENT_NAME');
  const configurationProfileName = requireEnvironmentVariable('AWS_APPCONFIG_CONFIGURATION_PROFILE_NAME');
  const httpPort = requireEnvironmentVariable('AWS_APPCONFIG_EXTENSION_HTTP_PORT', '2772');

  const url = `http://localhost:${httpPort}/applications/${applicationName}/environments/${environmentName}/configurations/${configurationProfileName}`;

  try {
    const json = await fetch(url);
    const data = JSON.parse(json);
    const enabled = data[`enable${configurationType}`];
    const number = data[`numberOf${configurationType}`];

    if (enabled && typeof number === 'number') {
      return number;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function lambdaHandler(event: any, context: any): Promise<string> {
  const exclamation = '!';
  const numExclamations = await getConfiguredNumberOf('ExclamationPoints', 1);

  return `Hello world${exclamation.repeat(numExclamations)}`;
}
