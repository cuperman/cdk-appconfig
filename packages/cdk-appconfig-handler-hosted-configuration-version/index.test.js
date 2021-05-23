jest.mock('aws-sdk/clients/appconfig');

const index = require('./index');
const AppConfig = require('aws-sdk/clients/appconfig');

function buildEvent(overrides = {}) {
  const defaults = {
    RequestType: 'Create',
    ResourceProperties: {
      ApplicationId: 'acb123',
      ConfigurationProfileId: 'def456',
      ContentType: 'text/plain',
      ContentConfig: {
        InlineContent: 'Hello, World!'
      },
      Description: undefined,
      LatestVersionNumber: undefined,
      InitOnly: 'false'
    }
  };

  return {
    ...defaults,
    ...overrides,
    ResourceProperties: {
      ...defaults.ResourceProperties,
      ...overrides.ResourceProperties
    }
  };
}

describe('Asset', () => {
  describe('index', () => {
    describe('onEvent', () => {
      describe('when RequestType is "Create"', () => {
        const event = buildEvent({
          RequestType: 'Create'
        });

        it('creates a new hosted configuration version', async () => {
          AppConfig.mockAwsResolvedValueOnce('createHostedConfigurationVersion', {
            VersionNumber: 1
          });

          const response = await index.onEvent(event);
          expect(response).toEqual({
            PhysicalResourceId: '1'
          });
        });
      });

      describe('when RequestType is "Update"', () => {
        describe('when InitOnly is false', () => {
          const event = buildEvent({
            RequestType: 'Update',
            PhysicalResourceId: '1',
            ResourceProperties: {
              InitOnly: 'false'
            }
          });

          it('creates a new hosted configuration version', async () => {
            AppConfig.mockAwsResolvedValueOnce('createHostedConfigurationVersion', {
              VersionNumber: 2
            });

            const response = await index.onEvent(event);
            expect(response).toEqual({
              PhysicalResourceId: '2'
            });
          });
        });

        describe('when InitOnly is true', () => {
          const event = buildEvent({
            RequestType: 'Update',
            PhysicalResourceId: '1',
            ResourceProperties: {
              InitOnly: 'true'
            }
          });

          it('does nothing and returns the same physical id', async () => {
            const response = await index.onEvent(event);
            expect(response).toEqual({
              PhysicalResourceId: '1'
            });
          });
        });
      });

      describe('when RequestType is "Delete"', () => {
        const event = buildEvent({
          RequestType: 'Delete',
          PhysicalResourceId: '1'
        });

        it('deletes a new hosted configuration version', async () => {
          AppConfig.mockAwsResolvedValueOnce('deleteHostedConfigurationVersion', {});

          const response = await index.onEvent(event);
          expect(response).toEqual(undefined);
        });
      });

      describe('when RequestType is unknown', () => {
        const event = buildEvent({
          RequestType: 'Foobar'
        });

        it('throws an error', async () => {
          expect(index.onEvent(event)).rejects.toThrowError('Invalid request type: Foobar');
        });
      });
    });
  });
});
