import { CeloContract } from '@celo/contractkit'
import { CELO, ChainId, currencyEquals, cUSD, Token } from '@ubeswap/sdk'
import { CEUR, MCELO, MCEUR, MCUSD } from 'constants/index'
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
    mcUSD: MCUSD[ChainId.ALFAJORES],
    mCELO: MCELO[ChainId.ALFAJORES],
  },
  [ChainId.MAINNET]: {
    lendingPool: '0xc1548F5AA1D76CDcAB7385FA6B5cEA70f941e535',
    lendingPoolCore: '0xAF106F8D4756490E7069027315F4886cc94A8F73',
    [CeloContract.GoldToken]: CELO[ChainId.MAINNET],
    [CeloContract.StableToken]: cUSD[ChainId.MAINNET],
    mcUSD: MCUSD[ChainId.MAINNET],
    mCELO: MCELO[ChainId.MAINNET],
  },
}

export const moolaDuals = (
  [
    [MCUSD, cUSD],
    [MCELO, CELO],
    [MCEUR, CEUR],
  ] as const
).flatMap((dual) => [dual, [dual[1], dual[0]] as const])

/**
 * Gets the Moola token that the token can be converted to/from.
 * @param currency
 * @returns
 */
export const getMoolaDual = (currency: Token): Token | null => {
  const { chainId } = currency
  if (chainId === ChainId.BAKLAVA) {
    return null
  }
  return moolaDuals.find((dual) => currencyEquals(dual[0][chainId], currency))?.[1]?.[chainId] ?? null
}

export type IMoolaChain = keyof typeof moolaLendingPools

export type MoolaConfig = typeof moolaLendingPools[IMoolaChain]

export const useMoolaConfig = () => {
  const { chainId } = useActiveWeb3React()
  // TODO(igm): this breaks on baklava
  const chainCfg = moolaLendingPools[chainId as IMoolaChain]
  const { lendingPool, lendingPoolCore } = chainCfg
  return {
    lendingPoolCore,
    lendingPool,
  }
}

export const useLendingPool = (): LendingPool => {
  const cfg = useMoolaConfig()
  if (!cfg) {
    throw new Error('no cfg')
  }
  const { library } = useActiveWeb3React()
  return useMemo(() => LendingPool__factory.connect(cfg.lendingPool, library as any), [cfg.lendingPool, library])
}
