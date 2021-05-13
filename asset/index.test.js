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
      description: undefined,
      latestVersionNumber: undefined,
      initOnly: undefined
    }
  };

  return {
    ...defaults,
    ...overrides
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
        const event = buildEvent({
          RequestType: 'Update'
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

      describe('when RequestType is "Delete"', () => {
        const event = buildEvent({
          RequestType: 'Delete'
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
