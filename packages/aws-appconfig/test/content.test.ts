import * as path from 'path';

import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';

import { AssetContent, BucketContent, Content, InlineContent } from '../lib';

describe('AppConfig', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');

  describe('Content', () => {
    describe('fromInline', () => {
      const inlineContent = Content.fromInline('Hello, World!');

      it('returns an InlineContent object', () => {
        expect(inlineContent).toBeInstanceOf(InlineContent);
      });

      describe('on bind', () => {
        const contentConfig = inlineContent.bind(stack);

        it('returns a ContentConfig with inline content', () => {
          expect(contentConfig.inlineContent).toEqual('Hello, World!');
          expect(contentConfig.s3Location).toBeUndefined();
        });
      });
    });

    describe('fromBucket', () => {
      const configBucket = s3.Bucket.fromBucketName(stack, 'ConfigBucket', 'config-bucket');
      const bucketContent = Content.fromBucket(configBucket, 'config.yml');

      it('returns an InlineContent object', () => {
        expect(bucketContent).toBeInstanceOf(BucketContent);
      });

      describe('on bind', () => {
        const contentConfig = bucketContent.bind(stack);

        it('returns a ContentConfig with an s3 location', () => {
          expect(contentConfig.inlineContent).toBeUndefined();
          expect(contentConfig.s3Location).toEqual({
            bucketName: 'config-bucket',
            objectKey: 'config.yml'
          });
        });
      });
    });

    describe('fromAsset', () => {
      const assetContent = Content.fromAsset(path.join(__dirname, '__fixtures__/config.yml'));

      it('returns an InlineContent object', () => {
        expect(assetContent).toBeInstanceOf(AssetContent);
      });

      describe('on bind', () => {
        const contentConfig = assetContent.bind(stack);

        it('returns a ContentConfig with an s3 location', () => {
          expect(contentConfig.inlineContent).toBeUndefined();
          expect(contentConfig.s3Location).toHaveProperty('bucketName');
          expect(contentConfig.s3Location).toHaveProperty('objectKey');
        });
      });
    });
  });
});
