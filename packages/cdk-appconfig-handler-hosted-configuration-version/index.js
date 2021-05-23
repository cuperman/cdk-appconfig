const S3 = require('aws-sdk/clients/s3');
const AppConfig = require('aws-sdk/clients/appconfig');

async function getContent(contentConfig) {
  console.log('getContent', contentConfig);

  const inlineContent = contentConfig.InlineContent;
  const s3Location = contentConfig.S3Location;

  if (inlineContent) {
    return contentConfig.InlineContent;
  }

  if (!s3Location) {
    throw new Error(`ContentConfig requires either InlineContent or S3Location`);
  }

  const s3 = new S3();

  const params = {
    Bucket: s3Location.BucketName,
    Key: s3Location.ObjectKey,
    VersionId: s3Location.ObjectVersion
  };
  console.log('s3.getObject params', params);
  const response = await s3.getObject(params).promise();
  console.log('s3.getObject response', response);

  return response.Body;
}

async function createConfigurationVersion(props) {
  console.log('createConfigurationVersion', props);
  const content = await getContent(props.ContentConfig);

  const appconfig = new AppConfig();
  const params = {
    ApplicationId: props.ApplicationId,
    ConfigurationProfileId: props.ConfigurationProfileId,
    Description: props.Description,
    ContentType: props.ContentType,
    Content: content,
    LatestVersionNumber: props.LatestVersionNumber
  };
  console.log('appconfig.createHostedConfigurationVersion params', params);
  const response = await appconfig.createHostedConfigurationVersion(params).promise();
  console.log('appconfig.createHostedConfigurationVersion response', response);

  return response;
}

async function deleteConfigurationVersion(physicalId, props) {
  console.log('deleteConfigurationVersion', props);
  const appconfig = new AppConfig();
  const params = {
    ApplicationId: props.ApplicationId,
    ConfigurationProfileId: props.ConfigurationProfileId,
    VersionNumber: physicalId
  };
  console.log('appconfig.deleteHostedConfigurationVersion params', params);
  const response = await appconfig.deleteHostedConfigurationVersion(params).promise();
  console.log('appconfig.deleteHostedConfigurationVersion response', response);

  return response;
}

async function onCreate(event) {
  console.log('onCreate', event);

  const props = event.ResourceProperties;
  console.log('props', props);

  const response = await createConfigurationVersion(props);

  const physicalId = response.VersionNumber.toString();
  console.log('physicalId', physicalId);

  return {
    PhysicalResourceId: physicalId
  };
}

async function onUpdate(event) {
  console.log('onUpdate', event);

  const physicalId = event.PhysicalResourceId;
  console.log('physicalId', physicalId);
  const props = event.ResourceProperties;
  console.log('props', props);

  if (props.InitOnly && props.InitOnly.toLowerCase() === 'true') {
    console.log('Init Only; skipping update');
    return { PhysicalResourceId: physicalId };
  }

  const response = await createConfigurationVersion(props);

  const newPhysicalId = response.VersionNumber.toString();
  console.log('newPhysicalId', newPhysicalId);

  return {
    PhysicalResourceId: newPhysicalId
  };
}

async function onDelete(event) {
  console.log('onDelete', event);

  const physicalId = event.PhysicalResourceId;
  console.log('physicalId', physicalId);
  const props = event.ResourceProperties;
  console.log('props', props);

  const response = await deleteConfigurationVersion(physicalId, props);

  return;
}

async function onEvent(event, context) {
  console.log('onEvent', event, context);

  const requestType = event.RequestType;
  console.log('requestType', requestType);

  switch (requestType) {
    case 'Create':
      return onCreate(event);
    case 'Update':
      return onUpdate(event);
    case 'Delete':
      return onDelete(event);
    default:
      throw new Error(`Invalid request type: ${requestType}`);
  }
}
exports.onEvent = onEvent;
