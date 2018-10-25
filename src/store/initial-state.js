import { generateContractsInitialState } from 'drizzle'

export default {
  contracts: generateContractsInitialState({ contracts: [], events: [], polls: [] }),
}
