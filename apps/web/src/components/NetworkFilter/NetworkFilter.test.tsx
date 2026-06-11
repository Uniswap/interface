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
})
