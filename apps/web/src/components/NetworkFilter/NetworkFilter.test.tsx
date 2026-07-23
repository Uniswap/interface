import type { ReactNode } from 'react'
import type { TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilterV2/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NetworkFilter } from './NetworkFilter'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('~/components/Dropdowns/Dropdown', () => ({
  Dropdown: ({
    children,
    menuLabel,
    toggleOpen,
  }: {
    children: ReactNode
    menuLabel: ReactNode
    toggleOpen: (open: boolean) => void
  }) => (
    <div>
      <button type="button" onClick={() => toggleOpen(true)}>
        {menuLabel}
      </button>
      {children}
    </div>
  ),
}))

const SUBSET_NETWORKS = [UniverseChainId.Mainnet, UniverseChainId.Base]
const ALL_NETWORKS = [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.ArbitrumOne]

vi.mock('~/components/NetworkFilter/useFilteredChains', () => ({
  useFilteredChainIds: (chains?: UniverseChainId[]) => chains ?? ALL_NETWORKS,
}))

const TIERED_OPTIONS = {
  withBalances: [{ chainId: UniverseChainId.Mainnet, label: 'Ethereum', balanceUSD: 100 }],
  otherNetworks: [{ chainId: UniverseChainId.Base, label: 'Base', balanceUSD: 0 }],
} satisfies TieredNetworkOptions

describe(NetworkFilter, () => {
  it('renders a searchable tiered menu without the all networks option', () => {
    const onPress = vi.fn()

    render(
      <NetworkFilter
        showSearch
        showMultichainOption={false}
        networks={[UniverseChainId.Mainnet, UniverseChainId.Base]}
        tieredOptions={TIERED_OPTIONS}
        currentChainId={UniverseChainId.Mainnet}
        onPress={onPress}
      />,
    )

    expect(screen.getByText('With balances')).toBeInTheDocument()
    expect(screen.getByText('Other networks')).toBeInTheDocument()
    expect(screen.queryByText('All networks')).not.toBeInTheDocument()

    fireEvent.change(screen.getByTestId(TestID.ExploreSearchInput), { target: { value: 'base' } })

    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument()
    expect(screen.getByText('Base')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Base'))

    expect(onPress).toHaveBeenCalledWith(UniverseChainId.Base)
  })

  describe('all networks option label', () => {
    it('shows a network count for subset all-networks options by default', () => {
      render(<NetworkFilter networks={SUBSET_NETWORKS} currentChainId={undefined} onPress={vi.fn()} />)

      expect(screen.getByText('2 networks')).toBeInTheDocument()
    })

    it('shows a network count for subset all-networks options in the searchable menu by default', () => {
      render(<NetworkFilter showSearch networks={SUBSET_NETWORKS} currentChainId={undefined} onPress={vi.fn()} />)

      expect(screen.getByText('2 networks')).toBeInTheDocument()
    })

    it('shows "All networks" when the full network list is available', () => {
      render(<NetworkFilter networks={ALL_NETWORKS} currentChainId={undefined} onPress={vi.fn()} />)

      expect(screen.getByText('All networks')).toBeInTheDocument()
      expect(screen.queryByText('3 networks')).not.toBeInTheDocument()
    })

    it('shows "All networks" for subset all-networks options when forceAllNetworksLabel is true', () => {
      const onPress = vi.fn()

      render(
        <NetworkFilter forceAllNetworksLabel networks={SUBSET_NETWORKS} currentChainId={undefined} onPress={onPress} />,
      )

      expect(screen.getByText('All networks')).toBeInTheDocument()
      expect(screen.queryByText('2 networks')).not.toBeInTheDocument()

      fireEvent.click(screen.getByText('All networks'))

      expect(onPress).toHaveBeenCalledWith(undefined)
    })

    it('shows "All networks" for subset all-networks options in the searchable menu when forceAllNetworksLabel is true', () => {
      const onPress = vi.fn()

      render(
        <NetworkFilter
          showSearch
          forceAllNetworksLabel
          networks={SUBSET_NETWORKS}
          currentChainId={undefined}
          onPress={onPress}
        />,
      )

      expect(screen.getByText('All networks')).toBeInTheDocument()
      expect(screen.queryByText('2 networks')).not.toBeInTheDocument()

      fireEvent.click(screen.getByText('All networks'))

      expect(onPress).toHaveBeenCalledWith(undefined)
    })
  })
})
