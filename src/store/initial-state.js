export default {
  web3Store: {
    web3: {},
    connected: false,
    aboutToggle: false,
    currentMaskAddress: undefined,
    metamaskLocked: true,
    interaction: '',
    networkMessage: '',
    factoryAddress: '0xD6D22d102A4237F3D35361BC022a78789E6174Aa',
    factoryContract: '',
    blockTimestamp: '',
    exchangeType: 'ETH to Token',
    exchangeAddresses: {
      addresses: [
        ['BAT','0x80f5C1beA2Ea4a9C21E4c6D7831ae2Dbce45674d'], 
        ['OMG','0x1033f09e293200de63AF16041e83000aFBBfF5c0']
      ]
    },
    tokenAddresses: {
      addresses: [
        ['BAT','0xDA5B056Cfb861282B4b59d29c9B395bcC238D29B'], 
        ['OMG','0x879884c3C46A24f56089f3bBbe4d5e38dB5788C0']
      ]
    }
  },
  exchangeContracts: {},
  tokenContracts: {},
  exchange: {
    inputBalance: 0,
    outputBalance: 0,
    inputToken: { value: 'ETH', label: 'ETH', clearableValue: false },
    outputToken: { value: 'OMG', label: 'OMG', clearableValue: false },
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
  }
}
