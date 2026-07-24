import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getExposureRows, shouldShowExposurePopover } from 'uniswap/src/features/earn/EarnExposurePopover'
import type { EarnVaultExposure, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { describe, expect, it } from 'vitest'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const VAULT_ADDRESS = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'

const NATIVE_ID = buildNativeCurrencyId(UniverseChainId.Mainnet)
const USDC_ID = buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS)
const USDT_ID = buildCurrencyId(UniverseChainId.Mainnet, USDT_ADDRESS)

function createVault(overrides: Partial<EarnVaultInfo> = {}): EarnVaultInfo {
  return {
    id: `1-${VAULT_ADDRESS}`,
    currencyId: USDC_ID,
    displayCurrencyId: USDC_ID,
    vaultAddress: VAULT_ADDRESS,
    chainId: UniverseChainId.Mainnet,
    apyPercent: 4,
    exposureCurrencyIds: [],
    exposures: [],
    totalDepositsUsd: 0,
    liquidityUsd: 0,
    curator: { name: 'Gauntlet' },
    ...overrides,
  }
}

function exposure(currencyId: string, valueUsd?: number): EarnVaultExposure {
  return { currencyId, valueUsd }
}

describe(getExposureRows, () => {
  it('hides the native token row when its exposure value is zero', () => {
    const rows = getExposureRows(createVault({ exposures: [exposure(NATIVE_ID, 0), exposure(USDC_ID, 1_000)] }))
    expect(rows.map((row) => row.currencyId)).toEqual([USDC_ID])
  })

  it('hides the native token row when its exposure value is missing (fully deployed)', () => {
    const rows = getExposureRows(createVault({ exposures: [exposure(NATIVE_ID), exposure(USDC_ID, 1_000)] }))
    expect(rows.map((row) => row.currencyId)).toEqual([USDC_ID])
  })

  it('keeps a non-native asset even when its exposure value is zero', () => {
    const rows = getExposureRows(createVault({ exposures: [exposure(USDC_ID, 0), exposure(USDT_ID, 1_000)] }))
    expect(rows.map((row) => row.currencyId)).toEqual([USDC_ID, USDT_ID])
  })

  it('keeps the native token row when it has a nonzero exposure value', () => {
    const rows = getExposureRows(createVault({ exposures: [exposure(NATIVE_ID, 500), exposure(USDC_ID, 1_000)] }))
    expect(rows.map((row) => row.currencyId)).toEqual([NATIVE_ID, USDC_ID])
  })

  it('does not filter the fallback exposureCurrencyIds branch', () => {
    const rows = getExposureRows(createVault({ exposures: [], exposureCurrencyIds: [NATIVE_ID, USDC_ID] }))
    expect(rows.map((row) => row.currencyId)).toEqual([NATIVE_ID, USDC_ID])
  })
})

describe(shouldShowExposurePopover, () => {
  it('hides the popover when filtering the zero native row leaves a single asset', () => {
    expect(
      shouldShowExposurePopover(createVault({ exposures: [exposure(NATIVE_ID, 0), exposure(USDC_ID, 1_000)] })),
    ).toBe(false)
  })

  it('shows the popover when multiple assets remain after filtering', () => {
    expect(
      shouldShowExposurePopover(createVault({ exposures: [exposure(NATIVE_ID, 500), exposure(USDC_ID, 1_000)] })),
    ).toBe(true)
  })
})
