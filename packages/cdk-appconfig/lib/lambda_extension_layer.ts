import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface LambdaExtensionLayerProps {
  readonly region?: string;
}

export class LambdaExtensionLayer extends cdk.Resource implements lambda.ILayerVersion {
  public readonly layerVersionArn: string;
  private lambdaExtensionMap: cdk.CfnMapping;

  constructor(scope: Construct, id: string, props?: LambdaExtensionLayerProps) {
    super(scope, id);

    // ensure there is only one mapping in the stack
    const lambdaExtensionMap = this.stack.node.tryFindChild('_LambdaExtensionMap');
    if (lambdaExtensionMap) {
      this.lambdaExtensionMap = lambdaExtensionMap as cdk.CfnMapping;
    } else {
      this.lambdaExtensionMap = new cdk.CfnMapping(this.stack, '_LambdaExtensionMap', {
        mapping: {
          'us-east-1': { arn: 'arn:aws:lambda:us-east-1:027255383542:layer:AWS-AppConfig-Extension:44' },
          'us-east-2': { arn: 'arn:aws:lambda:us-east-2:728743619870:layer:AWS-AppConfig-Extension:42' },
          'us-west-1': { arn: 'arn:aws:lambda:us-west-1:958113053741:layer:AWS-AppConfig-Extension:37' },
          'us-west-2': { arn: 'arn:aws:lambda:us-west-2:359756378197:layer:AWS-AppConfig-Extension:62' },
          'ca-central-1': { arn: 'arn:aws:lambda:ca-central-1:039592058896:layer:AWS-AppConfig-Extension:42' },
          'eu-central-1': { arn: 'arn:aws:lambda:eu-central-1:066940009817:layer:AWS-AppConfig-Extension:49' },
          'eu-west-1': { arn: 'arn:aws:lambda:eu-west-1:434848589818:layer:AWS-AppConfig-Extension:41' },
          'eu-west-2': { arn: 'arn:aws:lambda:eu-west-2:282860088358:layer:AWS-AppConfig-Extension:42' },
          'eu-west-3': { arn: 'arn:aws:lambda:eu-west-3:493207061005:layer:AWS-AppConfig-Extension:43' },
          'eu-north-1': { arn: 'arn:aws:lambda:eu-north-1:646970417810:layer:AWS-AppConfig-Extension:61' },
          'eu-south-1': { arn: 'arn:aws:lambda:eu-south-1:203683718741:layer:AWS-AppConfig-Extension:39' },
          'cn-north': { arn: 'arn:aws-cn:lambda:cn-north-1:615057806174:layer:AWS-AppConfig-Extension:38' },
          'cn-northwest': { arn: 'arn:aws-cn:lambda:cn-northwest-1:615084187847:layer:AWS-AppConfig-Extension:38' },
          'ap-east-1': { arn: 'arn:aws:lambda:ap-east-1:630222743974:layer:AWS-AppConfig-Extension:39' },
          'ap-northeast-1': { arn: 'arn:aws:lambda:ap-northeast-1:980059726660:layer:AWS-AppConfig-Extension:38' },
          'ap-northeast-3': { arn: 'arn:aws:lambda:ap-northeast-3:706869817123:layer:AWS-AppConfig-Extension:24' },
          'ap-northeast-2': { arn: 'arn:aws:lambda:ap-northeast-2:826293736237:layer:AWS-AppConfig-Extension:49' },
          'ap-southeast-1': { arn: 'arn:aws:lambda:ap-southeast-1:421114256042:layer:AWS-AppConfig-Extension:38' },
          'ap-southeast-2': { arn: 'arn:aws:lambda:ap-southeast-2:080788657173:layer:AWS-AppConfig-Extension:49' },
          'ap-south-1': { arn: 'arn:aws:lambda:ap-south-1:554480029851:layer:AWS-AppConfig-Extension:50' },
          'sa-east-1': { arn: 'arn:aws:lambda:sa-east-1:000010852771:layer:AWS-AppConfig-Extension:44' },
          'af-south-1': { arn: 'arn:aws:lambda:af-south-1:574348263942:layer:AWS-AppConfig-Extension:39' }
        }
      });
    }

    const region = props?.region ? props.region : cdk.Aws.REGION;
    this.layerVersionArn = this.lambdaExtensionMap.findInMap(region, 'arn');
  }

  public addPermission(_id: string, _permission: lambda.LayerVersionPermission): void {
    return;
  }
}
