import * as cdk from '@aws-cdk/core';
import * as ssm from '@aws-cdk/aws-ssm';
import * as appconfig from '@cuperman/cdk-appconfig';

export class SsmDocumentConfigurationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const schema = new ssm.CfnDocument(this, 'Schema', {
      name: 'MySchema',
      documentType: 'ApplicationConfigurationSchema',
      documentFormat: 'JSON',
      content: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        type: 'object',
        properties: {
          message: { type: 'string' },
          description: { type: 'string ' },
          version: { type: 'integer' },
          foo: { type: 'string' }
        },
        required: ['message'],
        additionalProperties: false
      },
      versionName: 'Foo'
    });

    // const doc = new ssm.CfnDocument(this, 'Doc', {
    //   documentType: 'ApplicationConfiguration',
    //   documentFormat: 'JSON',
    //   content: {
    //     message: 'Hello, World!'
    //   },
    //   requires: [
    //     {
    //       name: schema.ref,
    //       version: '2'
    //     }
    //   ]
    // });

    // doc.addDependsOn(schema);

    // const application = new appconfig.Application(this, 'App');

    // new appconfig.Environment(this, 'Environment', {
    //   application
    // });

    // new appconfig.SsmDocumentConfigurationProfile(this, 'Configuration', {
    //   application,
    //   ssmDocument: doc
    // });
  }
}
