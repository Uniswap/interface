import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { HookListResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import type { ComponentProps } from 'react'
import { PoolOptionItem } from 'uniswap/src/components/lists/items/pools/PoolOptionItem'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { buildHookRegistryMap, useHookRegistryMap } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import {
  UniswapHookProvenance,
  useUniswapHookProvenance,
} from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { render } from 'uniswap/src/test/test-utils'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { ellipseMiddle, shortenAddress } from 'utilities/src/addresses'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The shared vitest i18n mock returns raw keys; map the labels so the assertions read as the user sees it.
vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string, values?: Record<string, string>) => string } => ({
    t: (key: string, values?: Record<string, string>): string => {
      switch (key) {
        case 'common.dynamic':
          return 'Dynamic'
        case 'search.results.stats.volume':
          return `${values?.['volume']} vol`
        case 'search.results.stats.apr':
          return `${values?.['apr']} APR`
        default:
          return key
      }
    },
  }),
}))

vi.mock('uniswap/src/features/poolHooks/hooks/useHookRegistryMap', async () => {
  const actual = await vi.importActual('uniswap/src/features/poolHooks/hooks/useHookRegistryMap')
  return {
    ...actual,
    useHookRegistryMap: vi.fn(),
  }
})

vi.mock('uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance', async () => {
  const actual = await vi.importActual('uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance')
  return {
    ...actual,
    useUniswapHookProvenance: vi.fn(),
  }
})

const WETH = new Token(
  UniverseChainId.Mainnet,
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  18,
  'WETH',
  'Wrapped Ether',
)
const USDC = new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin')

const token0CurrencyInfo = buildCurrencyInfo({ currencyId: currencyId(WETH), currency: WETH, logoUrl: null })
const token1CurrencyInfo = buildCurrencyInfo({ currencyId: currencyId(USDC), currency: USDC, logoUrl: null })

const POOL_ID = '0x1234567890abcdef1234567890abcdef12345678'

function renderPoolOptionItem({
  feeTier,
  hookAddress,
  ...rest
}: {
  feeTier: number
  hookAddress?: string
} & Partial<
  Pick<ComponentProps<typeof PoolOptionItem>, 'identityPlacement' | 'searchStats' | 'rightElement'>
>): ReturnType<typeof render> {
  return render(
    <PoolOptionItem
      token0CurrencyInfo={token0CurrencyInfo}
      token1CurrencyInfo={token1CurrencyInfo}
      poolId={POOL_ID}
      chainId={UniverseChainId.Mainnet}
      onPress={vi.fn()}
      protocolVersion={ProtocolVersion.V4}
      hookAddress={hookAddress}
      feeTier={feeTier}
      {...rest}
    />,
  )
}

describe('PoolOptionItem', () => {
  beforeEach(() => {
    vi.mocked(useHookRegistryMap).mockReturnValue(new Map())
    vi.mocked(useUniswapHookProvenance).mockReturnValue(() => undefined)
  })

  it('renders the pool address as the subtitle by default', () => {
    const { getByText } = renderPoolOptionItem({ feeTier: 500 })
    expect(getByText(ellipseMiddle({ str: POOL_ID, charsStart: 6 }))).toBeTruthy()
  })

  describe('identityPlacement="subtitle"', () => {
    it('replaces the address with the version and fee tier', () => {
      const { getByText, queryByText } = renderPoolOptionItem({ feeTier: 500, identityPlacement: 'subtitle' })
      expect(getByText('v4')).toBeTruthy()
      expect(getByText('0.05%')).toBeTruthy()
      expect(queryByText(ellipseMiddle({ str: POOL_ID, charsStart: 6 }))).toBeNull()
    })

    it('renders the hook after the fee tier, with the Uniswap mark before the name', () => {
      const hookAddress = '0x0010d0d5db05933fa0d9f7038d365e1541a41888'
      vi.mocked(useHookRegistryMap).mockReturnValue(
        buildHookRegistryMap(
          new HookListResponse({
            hooks: [new HookEntry({ address: hookAddress, chain: 'Ethereum', chainId: 1, name: 'StablePairHook' })],
          }),
        ),
      )
      vi.mocked(useUniswapHookProvenance).mockReturnValue(() => UniswapHookProvenance.Built)

      renderPoolOptionItem({ feeTier: 500, hookAddress, identityPlacement: 'subtitle' })

      const pill = document.querySelector(`[data-testid="${TestID.PoolOptionItemHookBadge}"]`)
      const pillHtml = pill?.innerHTML ?? ''
      const markIndex = pillHtml.indexOf(TestID.UniswapBuiltHookMark)
      expect(markIndex).toBeGreaterThan(-1)
      expect(pillHtml.indexOf('StablePairHook')).toBeGreaterThan(markIndex)
    })
  })

  describe('searchStats', () => {
    it('renders volume and APR on the right when provided', () => {
      const { getByText } = renderPoolOptionItem({ feeTier: 500, searchStats: { volume1dUsd: 128_900_000, apr: 42.1 } })
      expect(getByText(/vol$/)).toBeTruthy()
      expect(getByText(/APR$/)).toBeTruthy()
    })

    it('renders nothing on the right when both stats are absent', () => {
      const { queryByText } = renderPoolOptionItem({ feeTier: 500, searchStats: {} })
      expect(queryByText(/vol$/)).toBeNull()
      expect(queryByText(/APR$/)).toBeNull()
    })

    it('prefers an explicit rightElement over the stats', () => {
      const { getByText, queryByText } = renderPoolOptionItem({
        feeTier: 500,
        searchStats: { volume1dUsd: 1, apr: 1 },
        rightElement: <>menu</>,
      })
      expect(getByText('menu')).toBeTruthy()
      expect(queryByText(/APR$/)).toBeNull()
    })
  })

  it('renders the "Dynamic" fee badge for a v4 dynamic-fee pool', () => {
    const { getByText, queryByText } = renderPoolOptionItem({ feeTier: DYNAMIC_FEE_AMOUNT })
    expect(getByText('Dynamic')).toBeTruthy()
    // DYNAMIC_FEE_AMOUNT (8388608 pips) must never be formatted as a rate (~838%).
    expect(queryByText(/838/)).toBeNull()
  })

  it('renders a normal fee tier as a percentage', () => {
    const { getByText } = renderPoolOptionItem({ feeTier: 500 })
    expect(getByText('WETH/USDC')).toBeTruthy()
    expect(getByText('0.05%')).toBeTruthy()
  })

  describe('hook badge', () => {
    const hookAddress = '0x0010d0d5db05933fa0d9f7038d365e1541a41888'

    function mockHookRegistryEntry(name: string): void {
      vi.mocked(useHookRegistryMap).mockReturnValue(
        buildHookRegistryMap(
          new HookListResponse({
            hooks: [new HookEntry({ address: hookAddress, chain: 'Ethereum', chainId: 1, name })],
          }),
        ),
      )
    }

    beforeEach(() => {
      // Default: registry membership alone, no Uniswap provenance — most registry hooks aren't Uniswap's.
      vi.mocked(useUniswapHookProvenance).mockReturnValue(() => undefined)
    })

    it('resolves and displays the hook name when the hook is in the registry', () => {
      mockHookRegistryEntry('StablePairHook')

      const { getByText, queryByText } = renderPoolOptionItem({ feeTier: 500, hookAddress })

      expect(getByText('StablePairHook')).toBeTruthy()
      expect(queryByText(shortenAddress({ address: hookAddress, chars: 4 }))).toBeNull()
    })

    it('shows the Uniswap mark for a hook the provenance config attributes to Uniswap', () => {
      mockHookRegistryEntry('StablePairHook')
      vi.mocked(useUniswapHookProvenance).mockReturnValue(() => UniswapHookProvenance.Built)

      const { getByTestId } = renderPoolOptionItem({ feeTier: 500, hookAddress })

      expect(getByTestId(TestID.UniswapBuiltHookMark)).toBeTruthy()
    })

    it('does not show the Uniswap mark for a registry-known hook with no Uniswap provenance', () => {
      mockHookRegistryEntry('StablePairHook')
      // beforeEach already defaults provenance to undefined — being in the registry isn't authorship.

      const { queryByTestId } = renderPoolOptionItem({ feeTier: 500, hookAddress })

      expect(queryByTestId(TestID.UniswapBuiltHookMark)).toBeNull()
    })

    it('renders the Uniswap mark inside the hook badge, before the name', () => {
      mockHookRegistryEntry('StablePairHook')
      vi.mocked(useUniswapHookProvenance).mockReturnValue(() => UniswapHookProvenance.Built)

      renderPoolOptionItem({ feeTier: 500, hookAddress })

      // This suite renders to real jsdom DOM (react-native-web), so the badge's own subtree proves
      // both containment (the mark is inside the pill) and order (it precedes the name).
      const badge = document.querySelector(`[data-testid="${TestID.PoolOptionItemHookBadge}"]`)
      const badgeHtml = badge?.innerHTML ?? ''
      const markIndex = badgeHtml.indexOf(TestID.UniswapBuiltHookMark)
      const nameIndex = badgeHtml.indexOf('StablePairHook')
      expect(markIndex).toBeGreaterThan(-1)
      expect(nameIndex).toBeGreaterThan(markIndex)
    })

    it('falls back to the shortened address when the hook is not in the registry', () => {
      vi.mocked(useHookRegistryMap).mockReturnValue(new Map())

      const { getByText, queryByTestId } = renderPoolOptionItem({ feeTier: 500, hookAddress })

      expect(getByText(shortenAddress({ address: hookAddress, chars: 4 }))).toBeTruthy()
      // Raw-address fallback gets no icon.
      expect(queryByTestId(TestID.UniswapBuiltHookMark)).toBeNull()
    })

    it('falls back to the shortened address when the registry entry has an empty name', () => {
      mockHookRegistryEntry('')
      vi.mocked(useUniswapHookProvenance).mockReturnValue(() => UniswapHookProvenance.Built)

      const { getByText, queryByTestId } = renderPoolOptionItem({ feeTier: 500, hookAddress })

      expect(getByText(shortenAddress({ address: hookAddress, chars: 4 }))).toBeTruthy()
      // No resolved name means no icon either, even with Uniswap provenance — the icon only ever
      // accompanies a real name, never the raw-address fallback.
      expect(queryByTestId(TestID.UniswapBuiltHookMark)).toBeNull()
    })

    it('treats a zero hook address as no hook and never fetches the registry', () => {
      const { queryByText } = renderPoolOptionItem({ feeTier: 500, hookAddress: ZERO_ADDRESS })

      expect(useHookRegistryMap).toHaveBeenLastCalledWith({ chainId: UniverseChainId.Mainnet, enabled: false })
      expect(queryByText(shortenAddress({ address: ZERO_ADDRESS, chars: 4 }))).toBeNull()
    })
  })
})
