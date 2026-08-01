import { shouldShowTokenDetailsEarnBanner } from 'uniswap/src/features/earn/tokenDetails'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { describe, expect, it } from 'vitest'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const VAULT_ADDRESS = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'

const earnVault: EarnVaultInfo = {
  id: `1-${VAULT_ADDRESS}`,
  currencyId: `1-${USDC_ADDRESS}`,
  displayCurrencyId: `1-${USDC_ADDRESS}`,
  vaultAddress: VAULT_ADDRESS,
  chainId: 1,
  apyPercent: 4,
  exposureCurrencyIds: [],
  exposures: [],
  totalDepositsUsd: 0,
  liquidityUsd: 0,
  curator: { name: 'Gauntlet' },
}

describe(shouldShowTokenDetailsEarnBanner, () => {
  it('hides for disconnected viewers', () => {
    expect(
      shouldShowTokenDetailsEarnBanner({
        earnVault,
        hasLoadedPositions: false,
        isLoggedIn: false,
        userHasEarnPosition: false,
      }),
    ).toBe(false)
    expect(
      shouldShowTokenDetailsEarnBanner({
        earnVault,
        hasLoadedPositions: true,
        isLoggedIn: false,
        userHasEarnPosition: false,
      }),
    ).toBe(false)
  })

  it('waits for connected viewer positions before showing the no-position banner', () => {
    expect(
      shouldShowTokenDetailsEarnBanner({
        earnVault,
        hasLoadedPositions: false,
        isLoggedIn: true,
        userHasEarnPosition: false,
      }),
    ).toBe(false)
  })

  it('shows for connected viewers after positions load without an earn position', () => {
    expect(
      shouldShowTokenDetailsEarnBanner({
        earnVault,
        hasLoadedPositions: true,
        isLoggedIn: true,
        userHasEarnPosition: false,
      }),
    ).toBe(true)
  })

  it('hides when the token has no earn vault or the viewer has an earn position', () => {
    expect(
      shouldShowTokenDetailsEarnBanner({
        earnVault: undefined,
        hasLoadedPositions: true,
        isLoggedIn: false,
        userHasEarnPosition: false,
      }),
    ).toBe(false)
    expect(
      shouldShowTokenDetailsEarnBanner({
        earnVault,
        hasLoadedPositions: true,
        isLoggedIn: true,
        userHasEarnPosition: true,
      }),
    ).toBe(false)
  })
})
