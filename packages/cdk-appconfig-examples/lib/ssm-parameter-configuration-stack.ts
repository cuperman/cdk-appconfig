import * as cdk from '@aws-cdk/core';
import * as ssm from '@aws-cdk/aws-ssm';
import * as appconfig from '@cuperman/cdk-appconfig';

export class SsmParameterConfigurationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const param = new ssm.StringParameter(this, 'Param', {
      type: ssm.ParameterType.STRING,
      stringValue: JSON.stringify({
        message: 'Hello, World!'
      })
    });

    const application = new appconfig.Application(this, 'App');

    new appconfig.Environment(this, 'Environment', {
      application
    });

    new appconfig.SsmParameterConfigurationProfile(this, 'Configuration', {
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
      ssmParameter: param
    });
  }
}
