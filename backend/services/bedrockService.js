/**
 * AWS Bedrock Service — Base client for invoking Claude models.
 * Model ID and region come from global appConfig (no hardcoding).
 */
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

function getBedrockClient() {
  const region = global.appConfig?.bedrockRegion || process.env.BEDROCK_REGION || 'us-east-1';
  return new BedrockRuntimeClient({ region });
}

/**
 * Invoke a Bedrock Claude model with a prompt.
 * @param {string} prompt - The full prompt text
 * @param {object} options - { modelId, maxTokens, temperature }
 * @returns {string} The model's text response
 */
async function invokeClaudeModel(prompt, options = {}) {
  const client  = getBedrockClient();
  const modelId = options.modelId
    || global.appConfig?.bedrockModelId
    || process.env.BEDROCK_MODEL_ID
    || 'anthropic.claude-3-haiku-20240307-v1:0';

  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: options.maxTokens || 1024,
    temperature: options.temperature || 0.3,
    messages: [{ role: 'user', content: prompt }],
  });

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body,
  });

  const response = await client.send(command);
  const result   = JSON.parse(Buffer.from(response.body).toString('utf-8'));
  return result.content[0].text;
}

module.exports = { invokeClaudeModel };
