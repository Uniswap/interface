import { TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { getSupportsSidebar } from 'uniswap/src/components/TokenSelectorV2/getSupportsSidebar'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'

const mockEnvState = vi.hoisted(() => ({ isWebApp: true }))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebApp(): boolean {
      return mockEnvState.isWebApp
    },
  }
})

const connectedAddresses = { evmAddress: '0x0000000000000000000000000000000000000001' } as AddressGroup
const disconnectedAddresses: AddressGroup = {}

describe('getSupportsSidebar', () => {
  beforeEach(() => {
    mockEnvState.isWebApp = true
  })

  it('supports the sidebar for a connected wallet on desktop web swap', () => {
    expect(
      getSupportsSidebar({
        isSmallScreen: false,
        variation: TokenSelectorVariation.SwapInput,
        addresses: connectedAddresses,
      }),
    ).toBe(true)
    expect(
      getSupportsSidebar({
        isSmallScreen: false,
        variation: TokenSelectorVariation.SwapOutput,
        addresses: connectedAddresses,
      }),
    ).toBe(true)
  })

  it('does not support the sidebar when the wallet is disconnected', () => {
    expect(
      getSupportsSidebar({
        isSmallScreen: false,
        variation: TokenSelectorVariation.SwapInput,
        addresses: disconnectedAddresses,
      }),
    ).toBe(false)
  })

  it('does not support the sidebar for BalancesOnly (send)', () => {
    expect(
      getSupportsSidebar({
        isSmallScreen: false,
        variation: TokenSelectorVariation.BalancesOnly,
        addresses: connectedAddresses,
      }),
    ).toBe(false)
  })

  it('does not support the sidebar on small screens', () => {
    expect(
      getSupportsSidebar({
        isSmallScreen: true,
        variation: TokenSelectorVariation.SwapInput,
        addresses: connectedAddresses,
      }),
    ).toBe(false)
  })

  it('does not support the sidebar outside the web app', () => {
    mockEnvState.isWebApp = false
    expect(
      getSupportsSidebar({
        isSmallScreen: false,
        variation: TokenSelectorVariation.SwapInput,
        addresses: connectedAddresses,
      }),
    ).toBe(false)
  })
})
