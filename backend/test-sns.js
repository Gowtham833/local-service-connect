require('dotenv').config();
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const sns = new SNSClient({ region: 'us-east-1' });
sns.send(new PublishCommand({ PhoneNumber: '+919876543210', Message: 'Test SMS from ServiConnect' }))
  .then(console.log)
  .catch(console.error);
