import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import type { AppStackScreenProp } from 'src/app/navigation/types'
import { PositionDetailsScreen } from 'src/screens/PositionDetailsScreen/PositionDetailsScreen'
import { render, screen } from 'src/test/test-utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

const mockUseGetPositionQuery = vi.fn()
vi.mock('uniswap/src/data/rest/getPosition', () => ({
  useGetPositionQuery: () => mockUseGetPositionQuery(),
}))

const mockParseRestPosition = vi.fn()
vi.mock('uniswap/src/features/positions/parseRestPosition', () => ({
  parseRestPosition: () => mockParseRestPosition(),
}))

vi.mock('uniswap/src/features/positions/hooks/usePriceRangeUsd', () => ({
  usePriceRangeUsd: () => ({ minPrice: '$1.00', maxPrice: '$2.00', marketPrice: '$1.50' }),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfos: () => [undefined, undefined],
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    convertFiatAmountFormatted: (value?: number) => `$${value ?? 0}`,
    formatNumberOrString: () => '1',
    formatPercent: (value: number) => `${value}%`,
  }),
}))

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountAddressWithThrow: () => '0xowner',
}))

vi.mock('uniswap/src/hooks/useAppInsets', () => ({
  useAppInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Keep the test focused on the screen's section-branching logic by stubbing children
// and the surrounding layout/telemetry chrome with identifiable markers.
vi.mock('src/components/layout/screens/ScreenWithHeader', async () => {
  const { Flex } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return {
    ScreenWithHeader: ({ children, rightElement }: { children: React.ReactNode; rightElement?: React.ReactNode }) => (
      <Flex>
        {rightElement}
        {children}
      </Flex>
    ),
  }
})

vi.mock('uniswap/src/features/telemetry/Trace', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('src/screens/PositionDetailsScreen/components/PositionDetailsMenu', async () => {
  const { Flex } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return { PositionDetailsMenu: () => <Flex testID="position-details-menu" /> }
})

vi.mock('src/screens/PositionDetailsScreen/components/PositionDetailsHero', () => ({
  PositionDetailsHero: () => null,
}))

vi.mock('src/screens/PositionDetailsScreen/components/PositionDetailsStats', async () => {
  const { Flex } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return {
    PositionDetailsStats: ({ isV2 }: { isV2: boolean }) => (
      <Flex testID={isV2 ? 'stats-full-range' : 'stats-concentrated'} />
    ),
  }
})

vi.mock('src/screens/PositionDetailsScreen/components/PositionFeesUnavailable', async () => {
  const { Flex } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return { PositionFeesUnavailable: () => <Flex testID="fees-unavailable" /> }
})

vi.mock('src/screens/PositionDetailsScreen/components/PositionTokenBreakdown', async () => {
  const { Flex } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return {
    PositionTokenBreakdown: ({ label, amount0, amount1 }: { label: string; amount0?: unknown; amount1?: unknown }) => {
      // i18n is key-echo mocked, so map the translation keys to the old slug names
      const slugByKey: Record<string, string> = {
        'pool.position.your': 'your-position',
        'common.feesEarned': 'fees-earned',
      }
      const slug = slugByKey[label] ?? label.toLowerCase().replace(/\s+/g, '-')
      const variant = amount0 && amount1 ? 'full' : 'collapsed'
      return <Flex testID={`breakdown-${slug}-${variant}`} />
    },
  }
})

const token0 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'ETH', 'Ether')
const token1 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'USDC', 'USD Coin')
const amount0 = CurrencyAmount.fromRawAmount(token0, '1000000000000000000')
const amount1 = CurrencyAmount.fromRawAmount(token1, '2000000000000000000000')

function makePosition(overrides: Partial<PositionInfo> = {}): PositionInfo {
  return {
    currency0Amount: amount0,
    currency1Amount: amount1,
    status: PositionStatus.IN_RANGE,
    version: ProtocolVersion.V4,
    chainId: 1,
    poolId: 'pool',
    totalValueUsd: 100,
    uncollectedFeesUsd: 5,
    apr: 10,
    ...overrides,
  } as unknown as PositionInfo
}

function renderScreen(
  positionInfo: PositionInfo | undefined,
  { isLoading = false, owner }: { isLoading?: boolean; owner?: string } = {},
): void {
  mockUseGetPositionQuery.mockReturnValue({ data: { position: {} }, isLoading })
  mockParseRestPosition.mockReturnValue(positionInfo)

  const props = {
    route: {
      params: {
        poolId: 'pool',
        tokenId: '1',
        chainId: UniverseChainId.Mainnet,
        protocolVersion: positionInfo?.version ?? ProtocolVersion.V4,
        owner,
      },
    },
  } as unknown as AppStackScreenProp<MobileScreens.PositionDetails>

  render(<PositionDetailsScreen {...props} />)
}

describe('PositionDetailsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders fees-unavailable and a full-range stats row for V2 positions', () => {
    renderScreen(makePosition({ version: ProtocolVersion.V2 }))

    expect(screen.getByTestId('stats-full-range')).toBeDefined()
    expect(screen.getByTestId('breakdown-your-position-full')).toBeDefined()
    expect(screen.getByTestId('fees-unavailable')).toBeDefined()
    expect(screen.queryByTestId('breakdown-fees-earned-full')).toBeNull()
    expect(screen.queryByTestId('breakdown-fees-earned-collapsed')).toBeNull()
  })

  it('collapses position and fees breakdowns for closed positions', () => {
    renderScreen(
      makePosition({
        status: PositionStatus.CLOSED,
        fee0Amount: amount0,
        fee1Amount: amount1,
      } as Partial<PositionInfo>),
    )

    expect(screen.getByTestId('stats-concentrated')).toBeDefined()
    expect(screen.getByTestId('breakdown-your-position-collapsed')).toBeDefined()
    expect(screen.getByTestId('breakdown-fees-earned-collapsed')).toBeDefined()
    expect(screen.queryByTestId('fees-unavailable')).toBeNull()
  })

  it('renders full position and fees breakdowns for open concentrated positions with fees', () => {
    renderScreen(makePosition({ fee0Amount: amount0, fee1Amount: amount1 } as Partial<PositionInfo>))

    expect(screen.getByTestId('stats-concentrated')).toBeDefined()
    expect(screen.getByTestId('breakdown-your-position-full')).toBeDefined()
    expect(screen.getByTestId('breakdown-fees-earned-full')).toBeDefined()
    expect(screen.queryByTestId('fees-unavailable')).toBeNull()
  })

  it('treats out-of-range positions like open positions (full breakdowns, no collapse)', () => {
    renderScreen(
      makePosition({
        status: PositionStatus.OUT_OF_RANGE,
        fee0Amount: amount0,
        fee1Amount: amount1,
      } as Partial<PositionInfo>),
    )

    expect(screen.getByTestId('stats-concentrated')).toBeDefined()
    expect(screen.getByTestId('breakdown-your-position-full')).toBeDefined()
    expect(screen.getByTestId('breakdown-fees-earned-full')).toBeDefined()
    expect(screen.queryByTestId('fees-unavailable')).toBeNull()
  })

  it('omits the fees section entirely when an open position has no fee amounts', () => {
    renderScreen(makePosition())

    expect(screen.getByTestId('breakdown-your-position-full')).toBeDefined()
    expect(screen.queryByTestId('breakdown-fees-earned-full')).toBeNull()
    expect(screen.queryByTestId('breakdown-fees-earned-collapsed')).toBeNull()
    expect(screen.queryByTestId('fees-unavailable')).toBeNull()
  })

  it('shows the loading skeleton while fetching and no position is parsed yet', () => {
    renderScreen(undefined, { isLoading: true })

    expect(screen.getByTestId('position-details-loader')).toBeDefined()
    expect(screen.queryByText('position.notFound')).toBeNull()
  })

  it('shows a not-found message when the position cannot be parsed', () => {
    renderScreen(undefined)

    expect(screen.getByText('position.notFound')).toBeDefined()
  })

  it('shows the details menu for the active account position', () => {
    renderScreen(makePosition())

    expect(screen.getByTestId('position-details-menu')).toBeDefined()
  })

  it('shows the details menu when the owner param matches the active account ignoring case', () => {
    renderScreen(makePosition(), { owner: '0xOWNER' })

    expect(screen.getByTestId('position-details-menu')).toBeDefined()
  })

  it('hides the details menu when viewing an external owner position', () => {
    renderScreen(makePosition(), { owner: '0xexternal' })

    expect(screen.queryByTestId('position-details-menu')).toBeNull()
  })
})
