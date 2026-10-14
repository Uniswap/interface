import { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { nativeOnChain, USDC } from 'uniswap/src/constants/tokens'
import { vi } from 'vitest'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useLiquidityUrlState } from '~/features/Liquidity/Create/hooks/useLiquidityUrlState'
import { useCurrencyWithLoading } from '~/hooks/Tokens'
import { mocked } from '~/test-utils/mocked'
import { render } from '~/test-utils/render'

// Unlike useLiquidityUrlState.test.ts, this suite leaves nuqs alone: the deprecated-param bug it guards
// lives in the ordering between the real `useQueryStates` and the migration, which a mocked
// `useQueryStates` cannot reproduce. Only the token lookup is stubbed.
vi.mock('~/hooks/Tokens', async () => {
  const actual = await vi.importActual('~/hooks/Tokens')
  return {
    ...actual,
    useCurrencyWithLoading: vi.fn(),
    checkIsNative: actual.checkIsNative,
  }
})

const useCurrencyWithLoadingMock = mocked(useCurrencyWithLoading)

const defaultChainId = UniverseChainId.Mainnet
const defaultInitialToken = nativeOnChain(defaultChainId)

interface RenderSnapshot {
  tokenA: Maybe<Currency>
  tokenB: Maybe<Currency>
  loading: boolean
}

function renderUrlState(searchParams: string): RenderSnapshot[] {
  const snapshots: RenderSnapshot[] = []

  function Probe(): null {
    const { tokenA, tokenB, loading } = useLiquidityUrlState()
    snapshots.push({ tokenA, tokenB, loading })
    return null
  }

  render(
    <NuqsTestingAdapter searchParams={searchParams}>
      <Probe />
    </NuqsTestingAdapter>,
  )

  return snapshots
}

describe('useLiquidityUrlState deprecated param migration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useCurrencyWithLoadingMock.mockImplementation(({ address }: { address?: string }) => {
      if (typeof address === 'string' && address.toUpperCase() === NATIVE_CHAIN_ID) {
        return { currency: defaultInitialToken, loading: false }
      }
      if (address === USDC.address) {
        return { currency: USDC, loading: false }
      }
      return { currency: undefined, loading: false }
    })
  })

  // CreatePositionContent freezes tokenA/tokenB into state when it mounts, so currencies that only
  // appear once the migration has rewritten the URL arrive too late and the form keeps its empty
  // "Choose token" inputs — the deprecated params have to resolve on the very first render.
  it('binds both currencies from the deprecated lowercase params on the first render', () => {
    const snapshots = renderUrlState(`currencya=${NATIVE_CHAIN_ID}&currencyb=${USDC.address}`)

    expect(snapshots[0]).toMatchObject({ tokenA: defaultInitialToken, tokenB: USDC })
    expect(snapshots.at(-1)).toMatchObject({ tokenA: defaultInitialToken, tokenB: USDC, loading: false })
  })

  it('gives a deprecated link the same first render as its canonical spelling', () => {
    const deprecated = renderUrlState(`currencya=${NATIVE_CHAIN_ID}&currencyb=${USDC.address}`)
    const canonical = renderUrlState(`currencyA=${NATIVE_CHAIN_ID}&currencyB=${USDC.address}`)

    expect(deprecated[0]).toEqual(canonical[0])
  })
})
