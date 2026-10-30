import { fireEvent, screen, waitFor } from '@testing-library/react'
import { TouchableArea } from '@universe/mycelium'
import { useState } from 'react'
import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginPositionActionsMenu } from '~/pages/Swap/Margin/components/MarginPositionActionsMenu'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket()

const { mockUseIsPlanInFlight } = vi.hoisted(() => ({ mockUseIsPlanInFlight: vi.fn(() => false) }))

vi.mock('~/pages/Swap/Margin/hooks/useIsPlanInFlight', () => ({ useIsPlanInFlight: mockUseIsPlanInFlight }))

// The real hook backs a MODULE-level store (at most one row open, globally) — every test in this file
// keys it identically, so real state would leak open/closed across tests in render order. Local state
// resets on every fresh render instead.
vi.mock('~/pages/Swap/Margin/hooks/marginRowMenuStore', () => ({
  useMarginRowMenu: (): { isOpen: boolean; setOpen: (open: boolean) => void } => {
    const [isOpen, setOpen] = useState(false)
    return { isOpen, setOpen }
  },
}))

// A full press, in the order a real mouse produces it. On web Tamagui maps onPressIn->mousedown,
// onPressOut->mouseup and onPress->click, and the trigger stops all three — so only the `click` step
// should ever open the menu, and none of the three should reach the surrounding row.
function pressTrigger(): void {
  const trigger = screen.getByLabelText('Position actions')
  fireEvent.mouseDown(trigger)
  fireEvent.mouseUp(trigger)
  fireEvent.click(trigger)
}

const ACCOUNT = '0x000000000000000000000000000000000000000A'

const POSITION: MarginActivePosition = {
  positionId: '7',
  status: 'ACTIVE',
  direction: MarginDirection.LONG,
  exposureToken: { address: MARKET.collateral.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.collateral.decimals },
  counterToken: { address: MARKET.debt.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.debt.decimals },
  size: '2000000000000000000',
  entryPrice: '1850000000000000000000',
  openedAt: '1753000000',
  legs: [{ venue: 'MORPHO', subId: '7', account: ACCOUNT, debt: '2000000000' }],
  isTradable: true,
  equity: '2000000000',
  leverage: '2',
  oraclePrice: '2000000000000000000000',
  liquidationPrice: '1162790697674418604651',
  buffer: '400000000000000000',
  healthFactor: '1720000000000000000',
  maxWithdrawable: '500000000000000000',
}

// Stands in for the table row, which is itself a TouchableArea whose press toggles expansion.
function Harness({
  onSelect = vi.fn(),
  onRowPress,
}: {
  onSelect?: (request: { action: string; positionId: string }) => void
  onRowPress?: () => void
}): JSX.Element {
  const menu = <MarginPositionActionsMenu position={POSITION} mountKey="row" onSelect={onSelect} />
  return onRowPress ? <TouchableArea onPress={onRowPress}>{menu}</TouchableArea> : menu
}

describe('MarginPositionActionsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsPlanInFlight.mockReturnValue(false)
  })

  it('renders all five actions with close last', () => {
    render(<Harness />)
    pressTrigger()
    expect(screen.getByText('Add margin')).toBeInTheDocument()
    expect(screen.getByText('Withdraw margin')).toBeInTheDocument()
    expect(screen.getByText('Change leverage')).toBeInTheDocument()
    expect(screen.getByText('Adjust position (advanced)')).toBeInTheDocument()
    expect(screen.getByText('Close position')).toBeInTheDocument()
  })

  it('renders the short menu subheader, not the tooltip sentence', () => {
    render(<Harness />)
    pressTrigger()
    expect(screen.getByText('Lower your leverage and risk')).toBeInTheDocument()
    expect(screen.queryByText(/Deposit more margin\./)).not.toBeInTheDocument()
  })

  it('does not toggle the surrounding row when opened', () => {
    const onRowPress = vi.fn()
    render(<Harness onRowPress={onRowPress} />)
    pressTrigger()
    // Positive control: without it, a menu that never opens makes this trivially green.
    expect(screen.getByText('Add margin')).toBeInTheDocument()
    expect(onRowPress).not.toHaveBeenCalled()
  })

  it('does not toggle the surrounding row when an item is selected', async () => {
    const onRowPress = vi.fn()
    const onSelect = vi.fn()
    render(<Harness onRowPress={onRowPress} onSelect={onSelect} />)
    pressTrigger()
    fireEvent.click(screen.getByText('Withdraw margin'))
    // positionId, never the leg's on-chain account address: two positions can share the latter, and a
    // request keyed on it would target whichever the finder reached first.
    expect(onSelect).toHaveBeenCalledWith({ action: 'withdraw', positionId: POSITION.positionId })
    expect(onRowPress).not.toHaveBeenCalled()
    // Lets the popover's post-close focus restoration settle inside an act() window instead of
    // leaking a "not wrapped in act" warning past the end of the test.
    await waitFor(() => {})
  })

  // The subheader swap alone is not proof: dropping isPlanInFlight from the `disabled` calc while
  // leaving the note intact would keep every item clickable and still pass a text-only assertion.
  it('renders every item disabled while a plan is in flight, and swallows the click', () => {
    mockUseIsPlanInFlight.mockReturnValue(true)
    const onSelect = vi.fn()
    render(<Harness onSelect={onSelect} />)
    pressTrigger()
    expect(screen.getAllByText('Another action is in progress')).toHaveLength(5)
    fireEvent.click(screen.getByText('Add margin'))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
