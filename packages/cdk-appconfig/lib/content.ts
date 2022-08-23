import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Assets from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';

export enum ContentType {
  TEXT = 'text/plain',
  JSON = 'application/json',
  YAML = 'application/x-yaml'
}

export interface ContentConfig {
  readonly inlineContent?: string;
  readonly s3Location?: s3.Location;
}

export abstract class Content {
  /**
   * Called when the hosted configuration version is initialized
   * to allow this object to create resources in the same scope.
   *
   * @param scope The binding scope
   */
  public abstract bind(scope: Construct): ContentConfig;

  public static fromInline(content: string): InlineContent {
    return new InlineContent(content);
  }

  public static fromBucket(bucket: s3.IBucket, key: string, objectVersion?: string): BucketContent {
    return new BucketContent(bucket, key, objectVersion);
  }

  public static fromAsset(path: string, options?: s3Assets.AssetOptions): AssetContent {
    return new AssetContent(path, options);
  }
}

export class InlineContent extends Content {
  private content: string;

  constructor(content: string) {
    super();

    this.content = content;
  }

  bind(_scope: Construct): ContentConfig {
    return {
      inlineContent: this.content
    };
  }
}

export class BucketContent extends Content {
  private bucket: s3.IBucket;
  private key: string;
  private objectVersion?: string;

  constructor(bucket: s3.IBucket, key: string, objectVersion?: string) {
    super();

    this.bucket = bucket;
    this.key = key;
    this.objectVersion = objectVersion;
  }

  bind(_scope: Construct): ContentConfig {
    return {
      s3Location: {
        bucketName: this.bucket.bucketName,
        objectKey: this.key,
        objectVersion: this.objectVersion
      }
    };
  }
}

export class AssetContent extends Content {
  private path: string;
  private options?: s3Assets.AssetOptions;

  constructor(path: string, options?: s3Assets.AssetOptions) {
    super();

    this.path = path;
    this.options = options;
  }

  bind(scope: Construct): ContentConfig {
    const asset = new s3Assets.Asset(scope, 'ContentAsset', {
      path: this.path,
      ...this.options
    });

    return {
      s3Location: {
        bucketName: asset.bucket.bucketName,
        objectKey: asset.s3ObjectKey
      }
    };
  }
}
