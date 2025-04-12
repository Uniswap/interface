import OpenAI from 'openai'
import { tools } from 'src/features/openai/functions'
import { config } from 'uniswap/src/config'
import { logger } from 'utilities/src/logger/logger'

export const ASSISTANT_ID = 'asst_PlaX9ILXiyV3cjsMEIUV6xbw'

export const openai = new OpenAI({
  apiKey: config.openaiApiKey,
})

// eslint-disable-next-line import/no-unused-modules
export function setupAssistant(): void {
  openai.beta.assistants
    .update(ASSISTANT_ID, {
      description: `
    You are a helpful assistant for a crypto wallet app that allows users to swap on the decentralized exchange Uniswap. You will help answer questions for the user and help them use the app more effectively. Assume that the user is asking about tokens on the Ethereum blockchain unless specified otherwise. Do not include links or urls in responses. You can address the user by their username`,
      tools,
    })
    .catch((error) => logger.debug('assistant.ts', 'setupAssistant', `Error fetching assistant: ${error}`))
}
