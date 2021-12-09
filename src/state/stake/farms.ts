export type MultiRewardPool = {
  address: string
  underlyingPool: string
  basePool: string
  numRewards: number
  active: boolean
}

export const multiRewardPools: MultiRewardPool[] = [
  // ** Friends ** //
  // CELO-MOBI
  {
    address: '0xb450940c5297e9b5e7167FAC5903fD1e90b439b8',
    underlyingPool: '0xd930501A0848DC0AA3E301c7B9b8AFE8134D7f5F',
    basePool: '0x19F1A692C77B481C23e9916E3E83Af919eD49765',
    numRewards: 3,
    active: true,
  },
  // mCUSD-mcEUR
  {
    address: '0x2Ca16986bEA18D562D26354b4Ff4C504F14fB01c',
    underlyingPool: '0xF554690b1A996893c4DEBadc57b759350dc10b29',
    basePool: '0xaAA7bf214367572cadbF17f17d8E035742b55ab9',
    numRewards: 3,
    active: true,
  },
  // MOO-mCELO
  {
    address: '0xE76525610652fFC3aF751Ab0dcC3448B345051F6',
    underlyingPool: '0xBA7dCc70c68e11633d7DACBAFa493Af61D0c5B1d',
    basePool: '0x54097E406DFC00B9179167F9E20B26406Ad42f0F',
    numRewards: 3,
    active: true,
  },
  // POOF-UBE
  {
    address: '0x4274AA72B12221D32ca77cB37057A9692E0b59Eb',
    underlyingPool: '0xC88B8d622c0322fb59ae4473D7A1798DE60785dD',
    basePool: '0xC88B8d622c0322fb59ae4473D7A1798DE60785dD',
    numRewards: 2,
    active: true,
  },
  // pCELO-POOF
  {
    address: '0x7B7F08164036abEbafD1bf75c1464c6F0d01653C',
    underlyingPool: '0xd60E0034D4B27DE226EFf13f68249F69d4D6Cb38',
    basePool: '0xd60E0034D4B27DE226EFf13f68249F69d4D6Cb38',
    numRewards: 2,
    active: true,
  },
  // KNX-CELO
  {
    address: '0x1f1678Cc7358F4ed808B53733Bc49c4CFFe8A075',
    underlyingPool: '0x7313fDf9D8Cab87E54efc8905B9D7d4BA3Fe7c8D',
    basePool: '0x7313fDf9D8Cab87E54efc8905B9D7d4BA3Fe7c8D',
    numRewards: 2,
    active: true,
  },
  // TFBX-UBE
  {
    address: '0x501ba7c59BA8afC1427F75D310A862BA0D2adcD2',
    underlyingPool: '0x3DAc201Ec1b3a037bC9124906A2ae0A6a09ACC1d',
    basePool: '0x3DAc201Ec1b3a037bC9124906A2ae0A6a09ACC1d',
    numRewards: 2,
    active: true,
  },
  // SOURCE-mcUSD
  {
    address: '0xF4662e4E254006939c2198cb6F61635b03fd14Eb',
    underlyingPool: '0x5F5c3eEa2b9e65f667E34C70Db68f62bbbFC9188',
    basePool: '0x9cAF0Cd20C8eF7622EEb8dB50e5bB4d407e38AE2',
    numRewards: 3,
    active: true,
  },

  // ** D4P ** //
  // UBE-CELO
  {
    address: '0x9D87c01672A7D02b2Dc0D0eB7A145C7e13793c3B',
    underlyingPool: '0x295D6f96081fEB1569d9Ce005F7f2710042ec6a1',
    basePool: '0x295D6f96081fEB1569d9Ce005F7f2710042ec6a1',
    numRewards: 2,
    active: true,
  },
  // rCELO-CELO
  {
    address: '0x194478Aa91e4D7762c3E51EeE57376ea9ac72761',
    underlyingPool: '0xD7D6b5213b9B9DFffbb7ef008b3cF3c677eb2468',
    basePool: '0xD7D6b5213b9B9DFffbb7ef008b3cF3c677eb2468',
    numRewards: 2,
    active: true,
  },
  // CELO-mcUSD
  {
    address: '0x161c77b4919271B7ED59AdB2151FdaDe3F907a1F',
    underlyingPool: '0xcca933D2ffEDCa69495435049a878C4DC34B079d',
    basePool: '0xcca933D2ffEDCa69495435049a878C4DC34B079d',
    numRewards: 2,
    active: true,
  },
  // CELO-mcEUR
  {
    address: '0x728C650D1Fb4da2D18ccF4DF45Af70c5AEb09f81',
    underlyingPool: '0x32779E096bF913093933Ea94d31956AF8a763CE9',
    basePool: '0x32779E096bF913093933Ea94d31956AF8a763CE9',
    numRewards: 2,
    active: true,
  },
  // WBTC-mcUSD
  {
    address: '0xf3D9E027B131Af5162451601038EddBF456d824B',
    underlyingPool: '0x0079418D54F887e7859c7A3Ecc16cE96A416527b',
    basePool: '0x0079418D54F887e7859c7A3Ecc16cE96A416527b',
    numRewards: 2,
    active: false,
  },
  // WETH-mcUSD
  {
    address: '0xD6E28720Fcd1C1aB6da2d1043a6763FDBb67b3aA',
    underlyingPool: '0x666C59E75271f1fF5a52b58D4563afdc76a53b4e',
    basePool: '0x666C59E75271f1fF5a52b58D4563afdc76a53b4e',
    numRewards: 2,
    active: false,
  },
  // WBTC-mcUSD
  {
    address: '0x81DDaFE15c01aDfda3dd8Fe9Bb984E64Cba606eB',
    underlyingPool: '0x1e41a9fd5a94def942ed46aa8bdb4a7f248efad3',
    basePool: '0x1e41a9fd5a94def942ed46aa8bdb4a7f248efad3',
    numRewards: 2,
    active: true,
  },
  // WETH-mcUSD
  {
    address: '0xE6AD921bDa9F4971aBc8FA78cBD07AeB5c1A61ea',
    underlyingPool: '0xc6910dB4156B535966E4a7e8CcA7D39579b99A81',
    basePool: '0xc6910dB4156B535966E4a7e8CcA7D39579b99A81',
    numRewards: 2,
    active: true,
  },
  // SUSHI-mcUSD
  {
    address: '0x0E83662A17B8A3a0585DcA34E5BE81ea6bd59556',
    underlyingPool: '0xA2674f69B2BEf4ca3E75589aD4f4d36F061048a9',
    basePool: '0xA2674f69B2BEf4ca3E75589aD4f4d36F061048a9',
    numRewards: 2,
    active: true,
  },
  // CRV-mcUSD
  {
    address: '0x85B21208C0058019bc8004D85eFEa881E7598D17',
    underlyingPool: '0xA92Bb4D6399Be5403d6c8DF3cce4dd991ca8EaFc',
    basePool: '0xA92Bb4D6399Be5403d6c8DF3cce4dd991ca8EaFc',
    numRewards: 2,
    active: true,
  },
  // AAVE-mcUSD
  {
    address: '0x09c1cF8669f9A026c59EDd4792944a9aCd2d2a2E',
    underlyingPool: '0xF20448aaF8CC60432FC2E774F9ED965D4bf77cDc',
    basePool: '0xF20448aaF8CC60432FC2E774F9ED965D4bf77cDc',
    numRewards: 2,
    active: true,
  },
  // FTM-mcUSD
  {
    address: '0x3C29593674c5c760172d354acE88Da4D9d3EB64f',
    underlyingPool: '0x5704F21cF5C7e6556cBD1ceEbbD23752B68e4845',
    basePool: '0x5704F21cF5C7e6556cBD1ceEbbD23752B68e4845',
    numRewards: 2,
    active: true,
  },
  // AVAX-mcUSD
  {
    address: '0x750bB68Fa18F06d9696af85Ecc312f178E75fCfD',
    underlyingPool: '0x9584870281DD0d764748a2a234e2218AE544C614',
    basePool: '0x9584870281DD0d764748a2a234e2218AE544C614',
    numRewards: 2,
    active: true,
  },
  // BNB-mcUSD
  {
    address: '0xCD2d4024A42109593301fF11967c16eA180DD381',
    underlyingPool: '0x522be12487d0640337abCfC7201066eC8F787AC5',
    basePool: '0x522be12487d0640337abCfC7201066eC8F787AC5',
    numRewards: 2,
    active: true,
  },
  // WMATIC-mcUSD
  {
    address: '0x00C4aCee9eB84B1a6Cdc741AeEd19BF84CbE7bF5',
    underlyingPool: '0x80ED8Da2d3cd269B0ccbc6ddF8DA2807BF583307',
    basePool: '0x80ED8Da2d3cd269B0ccbc6ddF8DA2807BF583307',
    numRewards: 2,
    active: true,
  },
  // SOL-CELO
  {
    address: '0x83470506ba97dB33Df0EBe01E876C6718C762Df6',
    underlyingPool: '0x33cD870547DD6F30db86e7EE7707DC78e7825289',
    basePool: '0x33cD870547DD6F30db86e7EE7707DC78e7825289',
    numRewards: 2,
    active: true,
  },

  // ** Inactive ** //
  // CELO-MOBI
  {
    address: '0xd930501A0848DC0AA3E301c7B9b8AFE8134D7f5F',
    underlyingPool: '0x19F1A692C77B481C23e9916E3E83Af919eD49765',
    basePool: '0x19F1A692C77B481C23e9916E3E83Af919eD49765',
    numRewards: 2,
    active: false,
  },
  // CELO-mcUSDxOLD
  {
    address: '0xbbC8C824c638fd238178a71F5b1E5Ce7e4Ce586B',
    underlyingPool: '0x66bD2eF224318cA5e3A93E165e77fAb6DD986E89',
    basePool: '0x66bD2eF224318cA5e3A93E165e77fAb6DD986E89',
    numRewards: 2,
    active: false,
  },
  // CELO-mcEURxOLD
  {
    address: '0x0F3d01aea89dA0b6AD81712Edb96FA7AF1c17E9B',
    underlyingPool: '0x08252f2E68826950d31D268DfAE5E691EE8a2426',
    basePool: '0x08252f2E68826950d31D268DfAE5E691EE8a2426',
    numRewards: 2,
    active: false,
  },
  // mCUSDxOLD-mcEURxOLD
  {
    address: '0x2f0ddEAa9DD2A0FB78d41e58AD35373d6A81EbB0',
    underlyingPool: '0xaf13437122cd537C5D8942f17787cbDBd787fE94',
    basePool: '0xaf13437122cd537C5D8942f17787cbDBd787fE94',
    numRewards: 2,
    active: false,
  },
  // MOO-mCELOxOLD
  {
    address: '0x84Bb1795b699Bf7a798C0d63e9Aad4c96B0830f4',
    underlyingPool: '0xC087aEcAC0a4991f9b0e931Ce2aC77a826DDdaf3',
    basePool: '0xC087aEcAC0a4991f9b0e931Ce2aC77a826DDdaf3',
    numRewards: 2,
    active: false,
  },
  // mCUSDxOLD-mcEURxOLD
  {
    address: '0x3d823f7979bB3af846D8F1a7d98922514eA203fC',
    underlyingPool: '0xb030882bfc44e223fd5e20d8645c961be9b30bb3',
    basePool: '0xaf13437122cd537C5D8942f17787cbDBd787fE94',
    numRewards: 3,
    active: false,
  },
  // MOO-mCELOxOLD
  {
    address: '0x3c7beeA32A49D96d72ce45C7DeFb5b287479C2ba',
    underlyingPool: '0x8f309df7527f16dff49065d3338ea3f3c12b5d09',
    basePool: '0xC087aEcAC0a4991f9b0e931Ce2aC77a826DDdaf3',
    numRewards: 3,
    active: false,
  },
]
