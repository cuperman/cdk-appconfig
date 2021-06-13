import * as nock from 'nock';
import { URL } from 'url';
import * as index from './index';

const APPCONFIG_URL =
  'http://localhost:2772/applications/helloworld/environments/demo/configurations/ExclamationPoints';

function mockResponse(urlString: string, respObject: any) {
  const url = new URL(urlString);
  nock(`${url.protocol}//${url.host}`).get(url.pathname).reply(200, respObject);
}

describe('index', () => {
  describe('lambdaHandler', () => {
    const event = {};
    const context = {};

    beforeEach(() => {
      process.env.AWS_APPCONFIG_EXTENSION_HTTP_URL = APPCONFIG_URL;
    });

    afterEach(() => {
      nock.cleanAll();
    });

    describe('when feature enabled', () => {
      beforeEach(() => {
        mockResponse(APPCONFIG_URL, {
          enableExclamationPoints: true,
          numberOfExclamationPoints: 5
        });
      });

      it('returns variable number of exclamation points', async () => {
        const result = await index.lambdaHandler(event, context);
        expect(result).toEqual('Hello world!!!!!');
      });
    });

    describe('when feature disabled', () => {
      beforeEach(() => {
        mockResponse(APPCONFIG_URL, {
          enableExclamationPoints: false,
          numberOfExclamationPoints: 5
        });
      });

      it('returns a single exclamation point', async () => {
        const result = await index.lambdaHandler(event, context);
        expect(result).toEqual('Hello world!');
      });
    });

    describe('when misconfigured', () => {
      beforeEach(() => {
        mockResponse(APPCONFIG_URL, {
          foo: 'bar'
        });
      });

      it('returns a single exclamation point', async () => {
        const result = await index.lambdaHandler(event, context);
        expect(result).toEqual('Hello world!');
      });
    });
  });
});
