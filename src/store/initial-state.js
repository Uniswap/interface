export default {
  web3Store: {
    web3: {},
    connected: false,
    aboutToggle: false,
    investToggle: false,
    currentMaskAddress: undefined,
    metamaskLocked: true,
    interaction: '',
    networkMessage: '',
    factoryAddress: '0x1dCcdeD9c35C0dd22dfC644BC17011Eb8e61ad91',
    factoryContract: '',
    blockTimestamp: '',
    exchangeType: 'ETH to Token',
    exchangeAddresses: {
      addresses: [
        ['BAT','0x80f5C1beA2Ea4a9C21E4c6D7831ae2Dbce45674d'],
        ['DAI','0x9eb0461bcc20229bE61319372cCA84d782823FCb'],
        ['MKR','0x4c86a3b3cf926de3644f60658071ca604949609f'],
        ['OMG','0x1033f09e293200de63AF16041e83000aFBBfF5c0'],
        ['ZRX','0x42E109452F4055c82a513A527690F2D73251367e']
      ]
    },
    tokenAddresses: {
      addresses: [
        ['BAT','0xDA5B056Cfb861282B4b59d29c9B395bcC238D29B'],
        ['DAI','0x2448eE2641d78CC42D7AD76498917359D961A783'],
        ['MKR','0xf9ba5210f91d0474bd1e1dcdaec4c58e359aad85'],
        ['OMG','0x879884c3C46A24f56089f3bBbe4d5e38dB5788C0'],
        ['ZRX','0xF22e3F33768354c9805d046af3C0926f27741B43']
      ]
    }
  },
  exchangeContracts: {},
  tokenContracts: {},
  exchange: {
    inputBalance: 0,
    outputBalance: 0,
    inputToken: { value: 'ETH', label: 'ETH', clearableValue: false },
    outputToken: { value: 'MKR', label: 'MKR', clearableValue: false },
    investToken: { value: 'BAT', label: 'BAT', clearableValue: false },
    invariant1: 0,
    invariant2: 0,
    marketEth1: 0,
    marketEth2: 0,
    marketTokens1: 0,
    marketTokens2: 0,
    allowanceApproved: true,
    inputValue: 0,
    outputValue: 0,
    rate: 0,
    fee: 0,
    investInvariant: 0,
    investEthPool: 0,
    investTokenPool: 0,
    investShares: 0,
    investTokenBalance: 0,
    investEthBalance: 0,
    investSharesInput: 0,
    investEthRequired: 0,
    investTokensRequired: 0
  }
}
