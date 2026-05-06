import { USDC_MAINNET, USDT, WBTC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'

export interface MockEarnVaultCurator {
  name: string
  address: string
  tvlUsd: number
}

export interface MockEarnVault {
  id: string
  currencyId: string
  apyPercent: number
  rewardsAprPercent: number
  exposureCurrencyIds: readonly string[]
  totalDepositsUsd: number
  liquidityUsd: number
  curator: MockEarnVaultCurator
  deploymentDate: Date
  morphoUrl: string
  exposureAndRiskUrl: string
}

// Mocked vault data for FE-1/FE-3 (CONS-1779, CONS-1781). Backend contracts
// (`GetEarnVaults`, `GetEarnVault`) land in FE-2 per the Earn M1 Implementation Plan.
const USDC_ID = buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address)
const USDT_ID = buildCurrencyId(UniverseChainId.Mainnet, USDT.address)
const WBTC_ID = buildCurrencyId(UniverseChainId.Mainnet, WBTC.address)
const ETH_ID = buildNativeCurrencyId(UniverseChainId.Mainnet)

const GAUNTLET_CURATOR: MockEarnVaultCurator = {
  name: 'Gauntlet',
  address: '0x1234000000000000000000000000000000001245',
  tvlUsd: 1_150_000_000,
}

export const MOCK_EARN_VAULTS: readonly MockEarnVault[] = [
  {
    id: 'mock-vault-usdt',
    currencyId: USDT_ID,
    apyPercent: 6.48,
    rewardsAprPercent: 1.2,
    exposureCurrencyIds: [WBTC_ID, ETH_ID, USDC_ID],
    totalDepositsUsd: 142_120_000,
    liquidityUsd: 51_030_000,
    curator: GAUNTLET_CURATOR,
    deploymentDate: new Date(2026, 0, 6),
    morphoUrl: '#',
    exposureAndRiskUrl: '#',
  },
  {
    id: 'mock-vault-usdc',
    currencyId: USDC_ID,
    apyPercent: 5.23,
    rewardsAprPercent: 0.85,
    exposureCurrencyIds: [WBTC_ID, ETH_ID, USDT_ID],
    totalDepositsUsd: 123_530_000,
    liquidityUsd: 43_530_000,
    curator: GAUNTLET_CURATOR,
    deploymentDate: new Date(2026, 0, 6),
    morphoUrl: '#',
    exposureAndRiskUrl: '#',
  },
  {
    id: 'mock-vault-eth',
    currencyId: ETH_ID,
    apyPercent: 4.19,
    rewardsAprPercent: 0.6,
    exposureCurrencyIds: [WBTC_ID, USDC_ID, USDT_ID],
    totalDepositsUsd: 89_210_000,
    liquidityUsd: 31_070_000,
    curator: GAUNTLET_CURATOR,
    deploymentDate: new Date(2026, 0, 6),
    morphoUrl: '#',
    exposureAndRiskUrl: '#',
  },
]
