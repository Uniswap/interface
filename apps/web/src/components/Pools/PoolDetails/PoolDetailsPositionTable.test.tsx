// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { PositionInfo } from 'components/Liquidity/types'
import { PoolDetailsPositionsTable } from 'components/Pools/PoolDetails/PoolDetailsPositionsTable'
import { TEST_TOKEN_1, TEST_TOKEN_2, toCurrencyAmount } from 'test-utils/constants'
import { render, screen } from 'test-utils/render'
import 'test-utils/tokens/mocks'

const mockPositionInfo: PositionInfo = {
  chainId: TEST_TOKEN_1.chainId,
  currency0Amount: toCurrencyAmount(TEST_TOKEN_1, 1),
  currency1Amount: toCurrencyAmount(TEST_TOKEN_2, 1),
  status: PositionStatus.IN_RANGE,
  version: ProtocolVersion.V3,
  tokenId: '1',
  v4hook: undefined,
  poolId: 'test-pool-id',
}

describe('PoolDetailsPositionsTable', () => {
  it('renders with PositionStatus In Range', () => {
    const { asFragment } = render(<PoolDetailsPositionsTable positions={[mockPositionInfo]} />)
    expect(screen.getByText('In range')).not.toBeNull()
    expect(screen.getByTestId('position-min--')).not.toBeNull()
    expect(screen.getByTestId('position-max--')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders with PositionStatus Closed', () => {
    const closedMockPositionInfo = { ...mockPositionInfo, status: PositionStatus.CLOSED }
    const { asFragment } = render(<PoolDetailsPositionsTable positions={[closedMockPositionInfo]} />)
    expect(screen.getByText('Closed')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders with PositionStatus Out Of Range', () => {
    const outOfRangeMockPositionInfo = { ...mockPositionInfo, status: PositionStatus.OUT_OF_RANGE }
    const { asFragment } = render(<PoolDetailsPositionsTable positions={[outOfRangeMockPositionInfo]} />)
    expect(screen.getByText('Out of range')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })
})
