import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { PositionDetailsHero } from 'src/screens/PositionDetailsScreen/components/PositionDetailsHero'
import { fireEvent, render, screen } from 'src/test/test-utils'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { shortenAddress } from 'utilities/src/addresses'

vi.mock('uniswap/src/components/CurrencyLogo/SplitLogo', () => ({
  SplitLogo: () => null,
}))

const token0 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'ETH', 'Ether')
const token1 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'USDC', 'USD Coin')
const hookAddress = '0x1111111111111111111111111111111111111111'

function makeV4Position(overrides: Partial<PositionInfo> = {}): PositionInfo {
  return {
    currency0Amount: CurrencyAmount.fromRawAmount(token0, '1000000000000000000'),
    currency1Amount: CurrencyAmount.fromRawAmount(token1, '2000000000000000000000'),
    version: ProtocolVersion.V4,
    status: PositionStatus.IN_RANGE,
    chainId: 1,
    feeTier: { isDynamic: false, feeAmount: 500, tickSpacing: 10 },
    v4hook: hookAddress,
    ...overrides,
  } as unknown as PositionInfo
}

describe('PositionDetailsHero', () => {
  it('renders the pair, protocol/fee/hook subtitle, value, and a tappable conversion row', () => {
    const onTogglePriceDirection = vi.fn()

    render(
      <PositionDetailsHero
        conversionText="1 ETH = 2,000 USDC"
        currency0Info={undefined}
        currency1Info={undefined}
        formattedValue="$1,234.00"
        positionInfo={makeV4Position()}
        onTogglePriceDirection={onTogglePriceDirection}
      />,
    )

    expect(screen.getByText('ETH / USDC')).toBeDefined()
    expect(screen.getByText('v4')).toBeDefined()
    expect(screen.getByText('0.05%')).toBeDefined()
    expect(screen.getByText(shortenAddress({ address: hookAddress }))).toBeDefined()
    expect(screen.getByText('$1,234.00')).toBeDefined()

    fireEvent.press(screen.getByText('1 ETH = 2,000 USDC'), { stopPropagation: vi.fn() })
    expect(onTogglePriceDirection).toHaveBeenCalledTimes(1)
  })

  it('omits the hook label when v4hook is the zero address', () => {
    render(
      <PositionDetailsHero
        conversionText="1 ETH = 2,000 USDC"
        currency0Info={undefined}
        currency1Info={undefined}
        formattedValue="$1,234.00"
        positionInfo={makeV4Position({ v4hook: '0x0000000000000000000000000000000000000000' })}
        onTogglePriceDirection={vi.fn()}
      />,
    )

    expect(screen.getByText('v4')).toBeDefined()
    expect(screen.queryByText(shortenAddress({ address: hookAddress }))).toBeNull()
  })

  it('omits the conversion row when no conversion text is provided', () => {
    render(
      <PositionDetailsHero
        currency0Info={undefined}
        currency1Info={undefined}
        formattedValue="$0.00"
        positionInfo={makeV4Position()}
        onTogglePriceDirection={vi.fn()}
      />,
    )

    expect(screen.queryByText('1 ETH = 2,000 USDC')).toBeNull()
    expect(screen.getByText('$0.00')).toBeDefined()
  })
})
