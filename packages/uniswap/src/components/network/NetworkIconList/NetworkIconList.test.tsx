import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { render } from 'uniswap/src/test/test-utils'
import { afterEach, beforeEach, vi } from 'vitest'

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', async (importOriginal) => {
  const mod = await importOriginal<typeof import('uniswap/src/features/chains/hooks/useEnabledChains')>()
  return {
    ...mod,
    useEnabledChains: vi.fn(mod.useEnabledChains),
  }
})

describe(NetworkIconList, () => {
  it('renders empty when no chainIds provided', () => {
    const tree = render(<NetworkIconList chainIds={[]} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders single network logo', () => {
    const tree = render(<NetworkIconList chainIds={[UniverseChainId.Mainnet]} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders stacked network logos', () => {
    const tree = render(
      <NetworkIconList chainIds={[UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne, UniverseChainId.Optimism]} />,
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders multiple network logos in list', () => {
    const tree = render(<NetworkIconList chainIds={[UniverseChainId.Mainnet, UniverseChainId.Polygon]} />)
    expect(tree).toMatchSnapshot()
  })
})

describe(`${NetworkIconList.name} showNumberBadge`, () => {
  /** Five unique enabled chains so real display logic shows 3 icons + overflow badge (+2). */
  const chainIdsForOverflow = [
    UniverseChainId.Mainnet,
    UniverseChainId.Polygon,
    UniverseChainId.ArbitrumOne,
    UniverseChainId.Optimism,
    UniverseChainId.Base,
  ]

  beforeEach(() => {
    vi.mocked(useEnabledChains).mockReturnValue({
      chains: chainIdsForOverflow,
      gqlChains: [],
      defaultChainId: UniverseChainId.Mainnet,
      isTestnetModeEnabled: false,
    })
  })

  afterEach(() => {
    vi.mocked(useEnabledChains).mockRestore()
  })

  it('does not render the overflow badge when showNumberBadge is false', () => {
    const { queryByTestId } = render(<NetworkIconList chainIds={chainIdsForOverflow} showNumberBadge={false} />)

    expect(queryByTestId('network-icon-list-overflow-badge')).toBeNull()
  })

  it('renders the overflow badge when showNumberBadge is true', () => {
    const { getByTestId } = render(<NetworkIconList chainIds={chainIdsForOverflow} showNumberBadge />)

    expect(getByTestId('network-icon-list-overflow-badge')).toBeTruthy()
  })
})
