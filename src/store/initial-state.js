// what states do you need upon initialization?

// connected: are you connnected? default state = false 
// props.metamask --> maybe we should keep this in global state too?

// both of these are set to false in the default state 
// fire dispatch functions to check for installation and connection in the default store 
// you are probably going to be storing stuff like invariants and all that jazz here 

export default {
  // lets check if metamask is installed 
  // also, lets assume that we're disconnected initially 
  // we're going to need to include a seperate nest for exchange actions
  web3: { 
    connected: false,
    currentMaskAddress: '',
    metamaskLocked: true,
    interaction: '',
    networkMessage: '',
    factoryAddress: '0xD6D22d102A4237F3D35361BC022a78789E6174Aa',
    factoryContract: '',
    blockTimestamp: '',
    exchangeType: 'ETH to Token',
    exchangeAddresses: {
      UNI: '0xcDc30C3b02c5776495298198377D2Fc0fd6B1F1C',
      SWT: '0x4632a7Cd732c625dcc48d75E289c209422e1D2B7'
    },
    tokenAddresses: {
      UNI: '0x350E5DD084ecF271e8d3531D4324443952F47756',
      SWT: '0x8B2A87F8243f23C33fb97E23a21Ae8EDB3b71AcA'
    }
  },
  exchangeContracts: {
    UNI: '',
    SWT: ''
  },
  tokenContracts: {
    UNI: '',
    SWT: ''
  },
  exchange: {
    inputBalance: 0,
    outputBalance: 0,
    inputToken: { value: 'ETH', label: 'ETH', clearableValue: false },
    outputToken: { value: 'UNI', label: 'UNI', clearableValue: false },
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