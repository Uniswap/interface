import { CeloContract } from '@celo/contractkit'
import { useContractKit, useProvider } from '@celo-tools/use-contractkit'
import { CELO, ChainId, currencyEquals, cUSD, Token } from '@ubeswap/sdk'
import { CEUR, MCELO, MCEUR, MCUSD } from 'constants/index'
import { useMemo } from 'react'

import { LendingPool, LendingPool__factory } from '../../../../generated'

export const moolaLendingPools = {
  // Addresses from: https://github.com/moolamarket/moola
  [ChainId.ALFAJORES]: {
    dataProvider: '0x31ccB9dC068058672D96E92BAf96B1607855822E',
    lendingPool: '0x58ad305f1eCe49ca55ADE0D5cCC90114C3902E88',
    lendingPoolCore: '0x090D652d1Bb0FEFbEe2531e9BBbb3604bE71f5de',
    [CeloContract.GoldToken]: CELO[ChainId.ALFAJORES],
    [CeloContract.StableToken]: cUSD[ChainId.ALFAJORES],
    mcUSD: MCUSD[ChainId.ALFAJORES],
    mCELO: MCELO[ChainId.ALFAJORES],
  },
  [ChainId.MAINNET]: {
    dataProvider: '0x43d067ed784D9DD2ffEda73775e2CC4c560103A1',
    lendingPool: '0x970b12522CA9b4054807a2c5B736149a5BE6f670',
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
  const { network } = useContractKit()
  const chainId = network.chainId as unknown as ChainId
  // TODO(igm): this breaks on baklava
  const chainCfg = moolaLendingPools[chainId as IMoolaChain]
  if (chainCfg) {
    const { lendingPool, lendingPoolCore } = chainCfg
    return {
      lendingPoolCore,
      lendingPool,
    }
  }
  return null
}

export const useLendingPool = (): LendingPool => {
  const cfg = useMoolaConfig()
  if (!cfg) {
    throw new Error('no cfg')
  }
  const library = useProvider()
  return useMemo(() => LendingPool__factory.connect(cfg.lendingPool, library as any), [cfg.lendingPool, library])
}
