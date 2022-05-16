import * as path from 'path';

import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deploy from '@aws-cdk/aws-s3-deployment';
import * as appconfig from '@cuperman/cdk-appconfig';

export class S3ConfigurationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      versioned: true
    });

    const configDeployment = new s3Deploy.BucketDeployment(this, 'ConfigDeployment', {
      sources: [s3Deploy.Source.asset(path.join(__dirname, '../config'))],
      destinationBucket: configBucket
    });

    const application = new appconfig.Application(this, 'App');

    new appconfig.Environment(this, 'Environment', {
      application
    });

    const configuration = new appconfig.S3ConfigurationProfile(this, 'Configuration', {
      application,
      validators: [
        appconfig.JsonSchemaValidator.fromInline(
          `{
            "$schema": "http://json-schema.org/draft-04/schema#",
            "type": "object",
            "properties": {
              "message": { "type": "string" }
            },
            "required": ["message"],
            "additionalProperties": true
          }`
        )
      ],
      s3Bucket: configBucket,
      s3ObjectKey: 'config.json'
    });

    configuration.node.addDependency(configDeployment);
  }
}
