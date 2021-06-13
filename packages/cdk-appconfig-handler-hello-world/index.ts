/*
 * Example from:
 * https://aws.amazon.com/blogs/mt/introducing-aws-appconfig-lambda-extension-deploying-application-configuration-serverless/
 */

import * as http from 'http';

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
  const url = process.env.AWS_APPCONFIG_EXTENSION_HTTP_URL;
  if (typeof url === 'undefined') {
    throw new Error('Environment variable "AWS_APPCONFIG_EXTENSION_HTTP_URL" required');
  }

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
