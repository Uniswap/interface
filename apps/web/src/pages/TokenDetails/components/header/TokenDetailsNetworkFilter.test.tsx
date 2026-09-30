import userEvent from '@testing-library/user-event'
import { UniverseChainId } from '@universe/chains'
import { useFeatureFlag } from '@universe/gating'
import { TestID } from '@universe/test'
import type { ComponentProps } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useFilteredChainIds } from '~/components/NetworkFilter/useFilteredChains'
import { TokenDetailsNetworkFilter } from '~/pages/TokenDetails/components/header/TokenDetailsNetworkFilter'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('~/components/NetworkFilter/useFilteredChains', () => ({
  useFilteredChainIds: vi.fn(),
}))

vi.mock('~/features/accounts/store/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/accounts/store/hooks')>()),
  useActiveAddresses: vi.fn(() => ({ evmAddress: undefined, svmAddress: undefined })),
}))

const ETHEREUM_LABEL = getChainInfo(UniverseChainId.Mainnet).label
const TWO_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Optimism]

// The interactive path mounts a NetworkFilter dropdown, which renders one option per selectable chain
// (the closed dropdown keeps a hidden measuring copy in the DOM). Its absence is what says "not mounted".
const ETHEREUM_OPTION = `${TestID.TokensNetworkFilterOptionPrefix}ethereum`

// The component returns null for the hidden cases; render into a known host so "renders nothing" is an
// assertion about the component and not about the test-harness providers wrapping it.
const HOST = 'network-filter-host'
function renderInHost(ui: JSX.Element): HTMLElement {
  render(<div data-testid={HOST}>{ui}</div>)
  return screen.getByTestId(HOST)
}

describe('TokenDetailsNetworkFilter', () => {
  beforeEach(() => {
    mocked(useFeatureFlag).mockReturnValue(false)
    mocked(useFilteredChainIds).mockReturnValue([
      UniverseChainId.Mainnet,
      UniverseChainId.Optimism,
      UniverseChainId.Base,
    ])
  })

  it('renders nothing for a single chain, which has nothing to switch to', () => {
    const host = renderInHost(
      <TokenDetailsNetworkFilter
        chainIds={[UniverseChainId.Mainnet]}
        selectedChainId={UniverseChainId.Mainnet}
        setSelectedChainId={vi.fn()}
        showAddressCopy={false}
      />,
    )

    expect(host.children).toHaveLength(0)
    expect(screen.queryByText(ETHEREUM_LABEL)).toBeNull()
  })

  it('renders nothing for zero chains', () => {
    const host = renderInHost(
      <TokenDetailsNetworkFilter
        chainIds={[]}
        selectedChainId={undefined}
        setSelectedChainId={vi.fn()}
        showAddressCopy={false}
      />,
    )

    expect(host.children).toHaveLength(0)
  })

  it('mounts the interactive filter for multiple chains', () => {
    renderInHost(
      <TokenDetailsNetworkFilter
        chainIds={TWO_CHAINS}
        selectedChainId={UniverseChainId.Mainnet}
        setSelectedChainId={vi.fn()}
        showAddressCopy={false}
      />,
    )

    expect(screen.getByTestId(ETHEREUM_OPTION)).toBeInTheDocument()
  })

  // Runtime companion to the type-level guard below: proves an option is genuinely wired to the caller's
  // setter, which a `setSelectedChainId ?? noop` fallback would have made unobservable.
  it('reports the picked chain to the caller', async () => {
    const setSelectedChainId = vi.fn()
    renderInHost(
      <TokenDetailsNetworkFilter
        chainIds={TWO_CHAINS}
        selectedChainId={UniverseChainId.Mainnet}
        setSelectedChainId={setSelectedChainId}
        showAddressCopy={false}
      />,
    )

    await userEvent.click(screen.getByTestId(`${TestID.TokensNetworkFilterOptionPrefix}optimism`))

    expect(setSelectedChainId).toHaveBeenCalledWith(UniverseChainId.Optimism)
  })

  it('requires a setter, so no caller can mount an interactive filter that no-ops', () => {
    const withoutSetter: Omit<ComponentProps<typeof TokenDetailsNetworkFilter>, 'setSelectedChainId'> = {
      chainIds: TWO_CHAINS,
      selectedChainId: UniverseChainId.Mainnet,
      showAddressCopy: false,
    }
    // Type-level guard. Were `setSelectedChainId` optional again (or internally defaulted to a `noop`),
    // this assignment would type-check, the directive would go unused, and `tsc` would fail on it. That
    // failure is the assertion — jsdom cannot observe "the dropdown quietly did nothing".
    // @ts-expect-error -- setSelectedChainId is required
    const asProps: ComponentProps<typeof TokenDetailsNetworkFilter> = withoutSetter
    expect(asProps.chainIds).toEqual(TWO_CHAINS)
  })
})
