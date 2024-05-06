import { Price, WETH9 } from '@uniswap/sdk-core'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { PositionInfo } from 'components/AccountDrawer/MiniPortfolio/Pools/cache'
import { USDC_MAINNET } from 'constants/tokens'
import { render, screen } from 'test-utils/render'

import { PoolDetailsPositionsTable } from './PoolDetailsPositionsTable'

const mockPositionInfo: PositionInfo = {
  owner: '0x1234',
  chainId: 1,
  pool: {
    token0: WETH9[1],
    token1: USDC_MAINNET,
    fee: 5000 as FeeAmount,
  } as Pool,
  details: {
    token0: WETH9[1].address,
    token1: USDC_MAINNET.address,
  },
  position: {
    token0PriceLower: new Price(WETH9[1], USDC_MAINNET, 1000000000000, 1),
    token0PriceUpper: new Price(WETH9[1], USDC_MAINNET, 1, 1000000000000),
  },
  inRange: true,
  closed: false,
} as PositionInfo

describe('PoolDetailsPositionsTable', () => {
  it('renders with PositionStatus In Range', () => {
    const { asFragment } = render(<PoolDetailsPositionsTable positions={[mockPositionInfo]} />)
    expect(screen.getByText('In range')).not.toBeNull()
    expect(screen.getByTestId('position-min-0')).not.toBeNull()
    expect(screen.getByTestId('position-max-1')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders with PositionStatus Closed', () => {
    const closedMockPositionInfo = { ...mockPositionInfo, closed: true, inRange: false }
    const { asFragment } = render(<PoolDetailsPositionsTable positions={[closedMockPositionInfo]} />)
    expect(screen.getByText('Closed')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders with PositionStatus Out Of Range', () => {
    const outOfRangeMockPositionInfo = { ...mockPositionInfo, inRange: false }
    const { asFragment } = render(<PoolDetailsPositionsTable positions={[outOfRangeMockPositionInfo]} />)
    expect(screen.getByText('Out of range')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })
})
