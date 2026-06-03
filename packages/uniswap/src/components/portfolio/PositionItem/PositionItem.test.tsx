import { fireEvent } from '@testing-library/react-native'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { PositionItem } from 'uniswap/src/components/portfolio/PositionItem/PositionItem'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PositionInfo, V3PositionInfo, V4PositionInfo } from 'uniswap/src/features/positions/types'
import { renderWithProviders } from 'uniswap/src/test/render'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => {
      const translations: Record<string, string> = {
        'common.dynamic': 'Dynamic',
        'common.withinRange': 'In range',
        'common.outOfRange': 'Out of range',
        'common.closed': 'Closed',
      }
      return translations[key] ?? key
    },
  }),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: (): { convertFiatAmountFormatted: (value: number | undefined) => string } => ({
    convertFiatAmountFormatted: (value): string => (value === undefined ? '' : `$${value.toFixed(2)}`),
  }),
}))

// SplitLogo fetches a token-list query via useCurrencyInfos. We don't care about the icons here —
// stubbing the hook keeps the test focused on row content and avoids Apollo mock plumbing.
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfos: (): Array<undefined> => [undefined, undefined],
}))

const WETH = new Token(
  UniverseChainId.Mainnet,
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  18,
  'WETH',
  'Wrapped Ether',
)
const USDC = new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin')

function buildV4Position(overrides?: Partial<V4PositionInfo>): PositionInfo {
  return {
    status: PositionStatus.IN_RANGE,
    version: ProtocolVersion.V4,
    chainId: UniverseChainId.Mainnet,
    poolId: '0xpool',
    tokenId: '1',
    currency0Amount: CurrencyAmount.fromRawAmount(WETH, '1000000000000000000'),
    currency1Amount: CurrencyAmount.fromRawAmount(USDC, '2850000000'),
    feeTier: { feeAmount: 500, tickSpacing: 10, isDynamic: false },
    totalValueUsd: 2852.43,
    v4hook: undefined,
    owner: '0x0000000000000000000000000000000000000000',
    isHidden: false,
    ...overrides,
  }
}

function buildV3Position(overrides?: Partial<V3PositionInfo>): PositionInfo {
  return {
    status: PositionStatus.OUT_OF_RANGE,
    version: ProtocolVersion.V3,
    chainId: UniverseChainId.Mainnet,
    poolId: '0xpool-v3',
    tokenId: '2',
    currency0Amount: CurrencyAmount.fromRawAmount(WETH, '200000000000000000'),
    currency1Amount: CurrencyAmount.fromRawAmount(USDC, '520000000'),
    feeTier: { feeAmount: 3000, tickSpacing: 60, isDynamic: false },
    totalValueUsd: 524.1,
    v4hook: undefined,
    owner: '0x0000000000000000000000000000000000000000',
    isHidden: false,
    ...overrides,
  }
}

describe('PositionItem', () => {
  it('renders the pair symbols, version, fee, value, and "In range" status', () => {
    const { getByText } = renderWithProviders(<PositionItem positionInfo={buildV4Position()} />)
    expect(getByText('WETH / USDC')).toBeTruthy()
    expect(getByText('v4')).toBeTruthy()
    expect(getByText('0.05%')).toBeTruthy()
    expect(getByText('$2852.43')).toBeTruthy()
    expect(getByText('In range')).toBeTruthy()
  })

  it('renders "Out of range" status for OUT_OF_RANGE positions', () => {
    const { getByText } = renderWithProviders(<PositionItem positionInfo={buildV3Position()} />)
    expect(getByText('Out of range')).toBeTruthy()
    expect(getByText('v3')).toBeTruthy()
    expect(getByText('0.3%')).toBeTruthy()
  })

  it('renders "Closed" status for CLOSED positions and still shows the $0.00 value', () => {
    const { getByText } = renderWithProviders(
      <PositionItem positionInfo={buildV4Position({ status: PositionStatus.CLOSED, totalValueUsd: 0 })} />,
    )
    expect(getByText('Closed')).toBeTruthy()
    expect(getByText('$0.00')).toBeTruthy()
  })

  it('omits the USD value text when totalValueUsd is undefined', () => {
    const { queryByText } = renderWithProviders(
      <PositionItem positionInfo={buildV4Position({ totalValueUsd: undefined })} />,
    )
    // Status text still renders; the value text does not.
    expect(queryByText(/\$/)).toBeNull()
  })

  it('renders the "Dynamic" fee label for dynamic-fee positions', () => {
    const { getByText } = renderWithProviders(
      <PositionItem
        positionInfo={buildV4Position({
          feeTier: { feeAmount: 8388608, tickSpacing: 60, isDynamic: true },
        })}
      />,
    )
    expect(getByText('Dynamic')).toBeTruthy()
  })

  it('calls onPress when the row is tapped (no contextMenuActions)', () => {
    const onPress = vi.fn()
    const { getByText } = renderWithProviders(<PositionItem positionInfo={buildV4Position()} onPress={onPress} />)
    fireEvent.press(getByText('WETH / USDC'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders the row inside a context menu wrapper when contextMenuActions is set', () => {
    // The mobile context menu wrapper renders the row inside a TouchableArea + ContextMenu;
    // we only assert that the row content still renders so the wrapping doesn't break it.
    const { getByText } = renderWithProviders(
      <PositionItem positionInfo={buildV4Position()} contextMenuActions={{ isVisible: true }} />,
    )
    expect(getByText('WETH / USDC')).toBeTruthy()
  })
})
