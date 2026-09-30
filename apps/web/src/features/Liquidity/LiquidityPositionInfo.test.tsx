import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { TestID } from '@universe/test'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { LiquidityPositionInfo } from '~/features/Liquidity/LiquidityPositionInfo'
import { TEST_TOKEN_1, TEST_TOKEN_2, toCurrencyAmount, USDC_INFO, WETH_INFO } from '~/test-utils/constants'
import { fireEvent, render, within } from '~/test-utils/render'

const { mockNavigate, mockUseMedia } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseMedia: vi.fn((): Record<string, boolean> => ({})),
}))

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

// LiquidityPositionInfo reads `useMedia` from the mycelium compat hook (INFRA-3160 took this file off
// Tamagui). Nested children are still on `ui/src`, so both are mocked from the same fake to keep every
// consumer on one media state.
vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return {
    ...actual,
    useMedia: () => mockUseMedia(),
  }
})

vi.mock('ui/src', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui/src')>()
  return {
    ...actual,
    useMedia: () => mockUseMedia(),
  }
})

vi.mock('~/features/Liquidity/utils')

describe('LiquidityPositionInfo', () => {
  it('should render in range', () => {
    const positionInfo: PositionInfo = {
      chainId: TEST_TOKEN_1.chainId,
      currency0Amount: toCurrencyAmount(TEST_TOKEN_1, 1),
      currency1Amount: toCurrencyAmount(TEST_TOKEN_2, 1),
      status: PositionStatus.IN_RANGE,
      version: ProtocolVersion.V3,
      poolId: '1',
      tokenId: '1',
      v4hook: undefined,
      owner: '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3',
    }
    const { getByText } = render(<LiquidityPositionInfo positionInfo={positionInfo} />)
    expect(getByText('In range')).toBeInTheDocument()
  })

  it('should render out of range', () => {
    const positionInfo: PositionInfo = {
      chainId: TEST_TOKEN_1.chainId,
      currency0Amount: toCurrencyAmount(TEST_TOKEN_1, 1),
      currency1Amount: toCurrencyAmount(TEST_TOKEN_2, 1),
      status: PositionStatus.OUT_OF_RANGE,
      version: ProtocolVersion.V3,
      poolId: '1',
      tokenId: '4',
      v4hook: undefined,
      owner: '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3',
    }
    const { getByText } = render(<LiquidityPositionInfo positionInfo={positionInfo} />)
    expect(getByText('Out of range')).toBeInTheDocument()
  })

  it('should render closed', () => {
    const positionInfo: PositionInfo = {
      chainId: TEST_TOKEN_1.chainId,
      currency0Amount: toCurrencyAmount(TEST_TOKEN_1, 1),
      currency1Amount: toCurrencyAmount(TEST_TOKEN_2, 1),
      poolId: '1',
      status: PositionStatus.CLOSED,
      version: ProtocolVersion.V3,
      tokenId: '1',
      v4hook: undefined,
      owner: '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3',
    }
    const { getByText } = render(<LiquidityPositionInfo positionInfo={positionInfo} />)
    expect(getByText('Closed')).toBeInTheDocument()
  })

  describe('pair label orientation', () => {
    const basePosition = {
      status: PositionStatus.IN_RANGE,
      version: ProtocolVersion.V3,
      poolId: '1',
      tokenId: '1',
      v4hook: undefined,
      owner: '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3',
      // PositionInfo is a union discriminated on `version`; keep the literal narrow through the spread.
    } as const

    it('quotes in the stablecoin when token0 is the stablecoin, matching the positions table', () => {
      // USDC sorts below WETH by address, so the pool's token0 is USDC; the label should still read WETH / USDC.
      const positionInfo: PositionInfo = {
        ...basePosition,
        chainId: USDC_INFO.currency.chainId,
        currency0Amount: CurrencyAmount.fromRawAmount(USDC_INFO.currency, 1),
        currency1Amount: CurrencyAmount.fromRawAmount(WETH_INFO.currency, 1),
      }
      const { getByText, queryByText } = render(<LiquidityPositionInfo positionInfo={positionInfo} />)
      expect(getByText('WETH / USDC')).toBeInTheDocument()
      expect(queryByText('USDC / WETH')).not.toBeInTheDocument()
    })

    it('keeps token0 / token1 order when both tokens share a waterfall tier', () => {
      const positionInfo: PositionInfo = {
        ...basePosition,
        chainId: TEST_TOKEN_1.chainId,
        currency0Amount: toCurrencyAmount(TEST_TOKEN_1, 1),
        currency1Amount: toCurrencyAmount(TEST_TOKEN_2, 1),
      }
      const { getByText } = render(<LiquidityPositionInfo positionInfo={positionInfo} />)
      expect(getByText(`${TEST_TOKEN_1.symbol} / ${TEST_TOKEN_2.symbol}`)).toBeInTheDocument()
    })
  })

  it('navigates to a chain-qualified /migrate/v2 URL when migrating a V2 position', () => {
    mockNavigate.mockClear()
    const positionInfo = {
      chainId: TEST_TOKEN_1.chainId,
      currency0Amount: toCurrencyAmount(TEST_TOKEN_1, 1),
      currency1Amount: toCurrencyAmount(TEST_TOKEN_2, 1),
      status: PositionStatus.IN_RANGE,
      version: ProtocolVersion.V2,
      poolId: '1',
      tokenId: '1',
      v4hook: undefined,
      owner: '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3',
      liquidityToken: { isToken: true, address: '0xpair' },
    } as unknown as PositionInfo

    const { getByText, queryByText } = render(<LiquidityPositionInfo positionInfo={positionInfo} showMigrateButton />)

    const migrateBadge = queryByText('Migrate to v3') ?? getByText('Migrate')
    fireEvent.click(migrateBadge)

    expect(mockNavigate).toHaveBeenCalledWith(`/migrate/v2/${getChainInfo(TEST_TOKEN_1.chainId).urlParam}/0xpair`)
  })

  describe('detail header (stackedLogo)', () => {
    afterEach(() => {
      mockUseMedia.mockReturnValue({})
    })

    const positionInfo: PositionInfo = {
      chainId: TEST_TOKEN_1.chainId,
      currency0Amount: toCurrencyAmount(TEST_TOKEN_1, 1),
      currency1Amount: toCurrencyAmount(TEST_TOKEN_2, 1),
      status: PositionStatus.IN_RANGE,
      version: ProtocolVersion.V3,
      poolId: '1',
      tokenId: '1',
      v4hook: undefined,
      owner: '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3',
    }

    it('keeps the badges in the title row (not the status row) on desktop', () => {
      const { getByText, getByTestId } = render(
        <LiquidityPositionInfo positionInfo={positionInfo} stackedLogo includeNetwork />,
      )
      expect(getByText('In range')).toBeInTheDocument()
      // On desktop the version/fee badges stay up in the title row, so row 2 has no version badge.
      expect(within(getByTestId(TestID.PositionInfoStatusRow)).queryByText('v3')).not.toBeInTheDocument()
    })

    // The mobile treatment is gated on media.md (≤640). The two cases below straddle that
    // boundary one token apart, so a gate on media.sm (badges would not move at 641) or
    // media.lg (badges would move in the 641–768 band) fails one of them.
    it('moves the badges onto the status row with the range indicator at ≤640 (media.md)', () => {
      mockUseMedia.mockReturnValue({ sm: false, md: true, lg: true })
      const statusRow = within(
        render(<LiquidityPositionInfo positionInfo={positionInfo} stackedLogo includeNetwork />).getByTestId(
          TestID.PositionInfoStatusRow,
        ),
      )
      // Mobile parity with the pool header: badges drop to row 2 alongside the range indicator.
      expect(statusRow.getByText('In range')).toBeInTheDocument()
      expect(statusRow.getByText('v3')).toBeInTheDocument()
    })

    it('keeps the badges in the title row across the 641–768 band (media.lg only)', () => {
      mockUseMedia.mockReturnValue({ sm: false, md: false, lg: true })
      const { getByText, getByTestId } = render(
        <LiquidityPositionInfo positionInfo={positionInfo} stackedLogo includeNetwork />,
      )
      expect(getByText('In range')).toBeInTheDocument()
      expect(within(getByTestId(TestID.PositionInfoStatusRow)).queryByText('v3')).not.toBeInTheDocument()
    })
  })
})
