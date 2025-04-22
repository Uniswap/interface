import { Stagehand } from '@browserbasehq/stagehand'

const stagehand = new Stagehand({
  env: 'LOCAL',
  debugDom: true,
  headless: true,
  verbose: 0,
  modelName: 'gpt-4o-mini',
  modelClientOptions: {
    apiKey: process.env.OPENAI_API_KEY,
  },
})

export default stagehand
