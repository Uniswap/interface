import { generateContractsInitialState } from 'drizzle'

export default {
  contracts: generateContractsInitialState({ contracts: [], events: [], polls: [] }),
  exchangeContracts: {},
  tokenContracts: {},
  exchange: {
    inputBalance: 0,
    outputBalance: 0,
    inputToken: { value: 'ETH', label: 'ETH', clearableValue: false },
    outputToken: { value: 'BAT', label: 'BAT', clearableValue: false },
    investToken: { value: 'BAT', label: 'BAT', clearableValue: false },
    ethPool1: 0,
    ethPool2: 0,
    tokenPool1: 0,
    tokenPool2: 0,
    allowanceApproved: true,
    inputValue: 0,
    outputValue: 0,
    rate: 0,
    fee: 0,
    investEthPool: 0,
    investTokenPool: 0,
    investShares: 0,
    userShares: 0,
    investTokenBalance: 0,
    investEthBalance: 0,
    investTokenAllowance: 0,
    investSharesInput: 0,
    investEthRequired: 0,
    investTokensRequired: 0,
    investChecked: true
  }
}
