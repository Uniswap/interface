import { WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { GetWalletsBalancesResponse, WalletBalance } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { FeatureFlags } from '@universe/gating'
import { getWalletBalancesIncludeCategories } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { selectTotalsByRequestedAddress } from 'uniswap/src/data/rest/getWalletsBalances/getWalletsBalances'

const mockGetFeatureFlag = vi.fn()

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  getFeatureFlag: (...args: unknown[]): boolean => mockGetFeatureFlag(...args) as boolean,
  getFeatureFlagWithExposureLoggingDisabled: (...args: unknown[]): boolean => mockGetFeatureFlag(...args) as boolean,
}))

function enableFlags(...enabledFlags: FeatureFlags[]): void {
  mockGetFeatureFlag.mockImplementation((flag: FeatureFlags) => enabledFlags.includes(flag))
}

const CHECKSUMMED_ADDRESS = '0xE0554a476A092703abdB3Ef35c80e0D76d32939F'
const LOWERCASE_ADDRESS = CHECKSUMMED_ADDRESS.toLowerCase()
const OTHER_ADDRESS = '0x1234567890123456789012345678901234567890'

function makeBalance({ address, totalUsd }: { address: string; totalUsd?: number }): WalletBalance {
  return {
    walletAccount: { platformAddresses: [{ platform: 1, address }] },
    total: totalUsd === undefined ? undefined : { valueUsd: totalUsd },
  } as unknown as WalletBalance
}

function makeResponse(balances: WalletBalance[]): GetWalletsBalancesResponse {
  return { balances } as unknown as GetWalletsBalancesResponse
}

describe('selectTotalsByRequestedAddress', () => {
  it('returns undefined when data is undefined', () => {
    expect(selectTotalsByRequestedAddress([OTHER_ADDRESS])(undefined)).toBeUndefined()
  })

  it('keys results by the requested address spelling, matching case-insensitively', () => {
    const response = makeResponse([makeBalance({ address: CHECKSUMMED_ADDRESS, totalUsd: 123 })])
    expect(selectTotalsByRequestedAddress([LOWERCASE_ADDRESS])(response)).toEqual({
      [LOWERCASE_ADDRESS]: 123,
    })
  })

  it('maps every requested address regardless of response order', () => {
    const response = makeResponse([
      makeBalance({ address: OTHER_ADDRESS, totalUsd: 50 }),
      makeBalance({ address: CHECKSUMMED_ADDRESS, totalUsd: 123 }),
    ])
    expect(selectTotalsByRequestedAddress([CHECKSUMMED_ADDRESS, OTHER_ADDRESS])(response)).toEqual({
      [CHECKSUMMED_ADDRESS]: 123,
      [OTHER_ADDRESS]: 50,
    })
  })

  it('maps a requested address missing from the response to undefined', () => {
    const response = makeResponse([makeBalance({ address: OTHER_ADDRESS, totalUsd: 50 })])
    expect(selectTotalsByRequestedAddress([CHECKSUMMED_ADDRESS])(response)).toEqual({
      [CHECKSUMMED_ADDRESS]: undefined,
    })
  })

  it('maps a wallet with an unset total (per-wallet BE failure) to undefined', () => {
    const response = makeResponse([makeBalance({ address: CHECKSUMMED_ADDRESS })])
    expect(selectTotalsByRequestedAddress([CHECKSUMMED_ADDRESS])(response)).toEqual({
      [CHECKSUMMED_ADDRESS]: undefined,
    })
  })

  it('preserves a zero balance as 0, not undefined', () => {
    const response = makeResponse([makeBalance({ address: CHECKSUMMED_ADDRESS, totalUsd: 0 })])
    expect(selectTotalsByRequestedAddress([CHECKSUMMED_ADDRESS])(response)).toEqual({
      [CHECKSUMMED_ADDRESS]: 0,
    })
  })
})

describe('getWalletBalancesIncludeCategories', () => {
  it('returns [POOLS] when only the pools balances flag is enabled', () => {
    enableFlags(FeatureFlags.PortfolioPoolsBalances)
    expect(getWalletBalancesIncludeCategories()).toEqual([WalletBalanceCategory.POOLS])
  })

  it('includes EARN_VAULTS when the earn flag is enabled', () => {
    enableFlags(FeatureFlags.PortfolioPoolsBalances, FeatureFlags.Earn)
    expect(getWalletBalancesIncludeCategories()).toEqual([
      WalletBalanceCategory.POOLS,
      WalletBalanceCategory.EARN_VAULTS,
    ])
  })

  it('returns [] when all balance-category flags are disabled', () => {
    enableFlags()
    expect(getWalletBalancesIncludeCategories()).toEqual([])
  })
})
