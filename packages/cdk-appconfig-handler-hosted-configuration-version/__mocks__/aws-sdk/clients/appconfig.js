const AppConfig = function constructor() {
  return this;
};

const mockResponseObjects = {
  createHostedConfigurationVersion: [],
  deleteHostedConfigurationVersion: []
};

AppConfig.mockAwsResolvedValueOnce = function (methodName, value) {
  mockResponseObjects[methodName].push({
    type: 'RESOLVE',
    value
  });
};

AppConfig.mockAwsRejectedValueOnce = function (methodName, value) {
  mockResponseObjects[methodName].push({
    type: 'REJECT',
    value
  });
};

function awsMockImplementation(methodName) {
  return (_params, callback) => {
    const response = mockResponseObjects[methodName].pop();

    const data = response && response.type == 'RESOLVE' ? response.value : {};
    const error = response && response.type == 'REJECT' ? response.value : null;

    setTimeout(() => callback(error, data), 0);

    return {
      promise: () => {
        return new Promise((resolve, reject) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
      }
    };
  };
}

AppConfig.prototype.createHostedConfigurationVersion = jest
  .fn()
  .mockImplementation(awsMockImplementation('createHostedConfigurationVersion'));

AppConfig.prototype.deleteHostedConfigurationVersion = jest
  .fn()
  .mockImplementation(awsMockImplementation('deleteHostedConfigurationVersion'));

module.exports = AppConfig;
