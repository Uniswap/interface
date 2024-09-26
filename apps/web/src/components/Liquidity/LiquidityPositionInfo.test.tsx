// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { getProtocolVersionLabel, usePositionInfo } from 'components/Liquidity/utils'
import { TEST_TOKEN_1, TEST_TOKEN_2, toCurrencyAmount } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

jest.mock('components/Liquidity/utils')

describe('LiquidityPositionInfo', () => {
  beforeEach(() => {
    mocked(getProtocolVersionLabel).mockReturnValue('V3')
  })

  it('should render in range', () => {
    mocked(usePositionInfo).mockReturnValue({
      currency0Amount: toCurrencyAmount(TEST_TOKEN_1, 1),
      currency1Amount: toCurrencyAmount(TEST_TOKEN_2, 1),
      status: PositionStatus.IN_RANGE,
      restPosition: {} as any,
      version: ProtocolVersion.V3,
    })
    const { getByText } = render(<LiquidityPositionInfo position={{} as any} />)
    expect(getByText('In range')).toBeInTheDocument()
  })

  it('should render out of range', () => {
    mocked(usePositionInfo).mockReturnValue({
      currency0Amount: toCurrencyAmount(TEST_TOKEN_1, 1),
      currency1Amount: toCurrencyAmount(TEST_TOKEN_2, 1),
      status: PositionStatus.OUT_OF_RANGE,
      restPosition: {} as any,
      version: ProtocolVersion.V3,
    })
    const { getByText } = render(<LiquidityPositionInfo position={{} as any} />)
    expect(getByText('Out of range')).toBeInTheDocument()
  })

  it('should render closed', () => {
    mocked(usePositionInfo).mockReturnValue({
      currency0Amount: toCurrencyAmount(TEST_TOKEN_1, 1),
      currency1Amount: toCurrencyAmount(TEST_TOKEN_2, 1),
      status: PositionStatus.CLOSED,
      restPosition: {} as any,
      version: ProtocolVersion.V3,
    })
    const { getByText } = render(<LiquidityPositionInfo position={{} as any} />)
    expect(getByText('Closed')).toBeInTheDocument()
  })
})
