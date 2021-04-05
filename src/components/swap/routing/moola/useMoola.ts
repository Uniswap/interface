import { CeloContract } from '@celo/contractkit'
import { CELO, ChainId, cUSD, Token } from '@ubeswap/sdk'
import { useActiveWeb3React } from 'hooks'
import { useMemo } from 'react'
import { LendingPool, LendingPool__factory } from '../../../../generated'

export const moolaLendingPools = {
  // Addresses from: https://github.com/moolamarket/moola
  [ChainId.ALFAJORES]: {
    lendingPool: '0x0886f74eEEc443fBb6907fB5528B57C28E813129',
    lendingPoolCore: '0x090D652d1Bb0FEFbEe2531e9BBbb3604bE71f5de',
    [CeloContract.GoldToken]: CELO[ChainId.ALFAJORES],
    [CeloContract.StableToken]: cUSD[ChainId.ALFAJORES],
    mcUSD: '0x71DB38719f9113A36e14F409bAD4F07B58b4730b',
    mCELO: '0x86f61EB83e10e914fc6F321F5dD3c2dD4860a003',
  },
  [ChainId.MAINNET]: {
    lendingPool: '0xc1548F5AA1D76CDcAB7385FA6B5cEA70f941e535',
    lendingPoolCore: '0xAF106F8D4756490E7069027315F4886cc94A8F73',
    [CeloContract.GoldToken]: CELO[ChainId.MAINNET],
    [CeloContract.StableToken]: cUSD[ChainId.MAINNET],
    mcUSD: '0x64dEFa3544c695db8c535D289d843a189aa26b98',
    mCELO: '0x7037F7296B2fc7908de7b57a89efaa8319f0C500',
  },
}
export type IMoolaChain = keyof typeof moolaLendingPools

export type MoolaConfig = typeof moolaLendingPools[IMoolaChain]

export const useMoolaConfig = () => {
  const { chainId } = useActiveWeb3React()
  if (chainId === ChainId.BAKLAVA) {
    return null
  }

  const chainCfg = moolaLendingPools[chainId]
  const { lendingPool, lendingPoolCore } = chainCfg

  const mcUSD = new Token(chainId, chainCfg.mcUSD, 18, 'mcUSD', 'Moola cUSD')
  const mCELO = new Token(chainId, chainCfg.mCELO, 18, 'mCELO', 'Moola CELO')

  return { lendingPoolCore, mcUSD, mCELO, lendingPool }
}

export const useLendingPool = (): LendingPool => {
  const cfg = useMoolaConfig()
  if (!cfg) {
    throw new Error('no cfg')
  }
  const { library } = useActiveWeb3React()
  return useMemo(() => LendingPool__factory.connect(cfg.lendingPool, library as any), [cfg.lendingPool, library])
}
