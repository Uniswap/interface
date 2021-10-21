export type MultiRewardPool = {
  address: string
  underlyingPool: string
  basePool: string
  numRewards: number
  active: boolean
}

export const multiRewardPools: MultiRewardPool[] = [
  // CELO-MOBI
  {
    address: '0xb450940c5297e9b5e7167FAC5903fD1e90b439b8',
    underlyingPool: '0xd930501A0848DC0AA3E301c7B9b8AFE8134D7f5F',
    basePool: '0x19F1A692C77B481C23e9916E3E83Af919eD49765',
    numRewards: 3,
    active: true,
  },
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
  // CELO-MOBI
  {
    address: '0xd930501A0848DC0AA3E301c7B9b8AFE8134D7f5F',
    underlyingPool: '0x19F1A692C77B481C23e9916E3E83Af919eD49765',
    basePool: '0x19F1A692C77B481C23e9916E3E83Af919eD49765',
    numRewards: 2,
    active: false,
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
