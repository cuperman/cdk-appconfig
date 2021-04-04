import * as cdk from '@aws-cdk/core';

export interface CdkAppconfigProps {
  // Define construct properties here
}

export class CdkAppconfig extends cdk.Construct {

  constructor(scope: cdk.Construct, id: string, props: CdkAppconfigProps = {}) {
    super(scope, id);

    // Define construct contents here
  }
}
