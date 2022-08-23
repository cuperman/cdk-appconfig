import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export enum ValidatorType {
  JSON_SCHEMA = 'JSON_SCHEMA',
  LAMBDA = 'LAMBDA'
}

export interface ValidatorConfig {
  readonly validatorType: ValidatorType;
  readonly content: string;
}

export abstract class Validator {
  /**
   * Called when the hosted configuration version is initialized
   * to allow this object to create resources in the same scope.
   *
   * @param scope The binding scope
   */
  public abstract bind(scope: Construct): ValidatorConfig;
}

export abstract class JsonSchemaValidator extends Validator {
  public static fromInline(schema: string): InlineJsonSchemaValidator {
    return new InlineJsonSchemaValidator(schema);
  }

  // TODO:
  // public static fromBucket(bucket: s3.IBucket, key: string, objectVersion?: string): BucketJsonSchemaValidator

  // TODO:
  // public static fromAsset(path: string, options?: s3Assets.AssetOptions): AssetJsonSchemaValidator
}

export class InlineJsonSchemaValidator extends JsonSchemaValidator {
  private content: string;

  constructor(content: string) {
    super();

    this.content = content;
  }

  bind(_scope: Construct): ValidatorConfig {
    return {
      validatorType: ValidatorType.JSON_SCHEMA,
      content: this.content
    };
  }
}

export class LambdaValidator extends Validator {
  private lambdaFunction: lambda.IFunction;

  constructor(lambdaFunction: lambda.IFunction) {
    super();

    this.lambdaFunction = lambdaFunction;
  }

  bind(_scope: Construct): ValidatorConfig {
    this.lambdaFunction.addPermission('AppConfigPermission', {
      principal: new iam.ServicePrincipal('appconfig.amazonaws.com')
    });

    return {
      validatorType: ValidatorType.LAMBDA,
      content: this.lambdaFunction.functionArn
    };
  }

  public static fromLambdaFunction(lambdaFunction: lambda.IFunction): LambdaValidator {
    return new LambdaValidator(lambdaFunction);
  }
}
