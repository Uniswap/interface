import { SharedEventName } from '@uniswap/analytics-events'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter/NetworkFilter'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Base]
const COMING_SOON = 'coming-soon-row'

async function openMenu(): Promise<void> {
  fireEvent.click(screen.getByTestId(TestID.TokensNetworkFilterTrigger))
  await screen.findByTestId(TestID.ExploreSearchInput)
}

describe(NetworkFilter, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the pill trigger with the selected network name', () => {
    render(
      <NetworkFilter
        trigger={{ variant: 'pill', showLabel: true }}
        includeAllNetworks
        chainIds={CHAINS}
        selectedChain={UniverseChainId.Base}
        onPressChain={vi.fn()}
      />,
    )

    expect(screen.getByTestId(TestID.TokensNetworkFilterTrigger)).toHaveTextContent('Base')
  })

  it('opens a searchable list and reports the picked chain with its analytics', async () => {
    const onPressChain = vi.fn()
    render(
      <NetworkFilter
        includeAllNetworks
        chainIds={CHAINS}
        selectedChain={UniverseChainId.Mainnet}
        selectionAnalytics={{ page: 'explore-page' }}
        onPressChain={onPressChain}
      />,
    )

    await openMenu()
    expect(screen.getByText('All networks')).toBeInTheDocument()

    fireEvent.change(screen.getByTestId(TestID.ExploreSearchInput), { target: { value: 'base' } })
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`))

    expect(onPressChain).toHaveBeenCalledWith(UniverseChainId.Base)
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      SharedEventName.ELEMENT_CLICKED,
      expect.objectContaining({
        page: 'explore-page',
        modal: ModalName.NetworkSelector,
        chain_id: UniverseChainId.Base,
        previous_chain_id: UniverseChainId.Mainnet,
      }),
    )
  })

  it('sends no selection event without selectionAnalytics', async () => {
    const onPressChain = vi.fn()
    render(
      <NetworkFilter
        includeAllNetworks
        chainIds={CHAINS}
        selectedChain={UniverseChainId.Mainnet}
        onPressChain={onPressChain}
      />,
    )

    await openMenu()
    fireEvent.click(screen.getByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`))

    expect(onPressChain).toHaveBeenCalledWith(UniverseChainId.Base)
    expect(sendAnalyticsEvent).not.toHaveBeenCalledWith(
      SharedEventName.ELEMENT_CLICKED,
      expect.objectContaining({ modal: ModalName.NetworkSelector }),
    )
  })

  it('shows the footer only while the list is unfiltered', async () => {
    render(
      <NetworkFilter
        includeAllNetworks
        chainIds={CHAINS}
        selectedChain={null}
        footer={<div data-testid={COMING_SOON}>Coming soon</div>}
        onPressChain={vi.fn()}
      />,
    )

    await openMenu()
    expect(screen.getByTestId(COMING_SOON)).toBeInTheDocument()

    fireEvent.change(screen.getByTestId(TestID.ExploreSearchInput), { target: { value: 'base' } })
    await waitFor(() => expect(screen.queryByTestId(COMING_SOON)).not.toBeInTheDocument())
  })

  it('drops the all networks row when only one chain is selectable', async () => {
    render(
      <NetworkFilter
        includeAllNetworks
        chainIds={[UniverseChainId.Base]}
        selectedChain={null}
        onPressChain={vi.fn()}
      />,
    )

    await openMenu()
    expect(screen.queryByText('All networks')).not.toBeInTheDocument()
    expect(screen.getByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`)).toBeInTheDocument()
  })
})
