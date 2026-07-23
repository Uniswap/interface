import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Text } from 'react-native'
import type { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { PositionItemContextMenu } from 'uniswap/src/components/portfolio/PositionItem/PositionItemContextMenu.native'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { renderWithProviders } from 'uniswap/src/test/render'
import type { Mock } from 'vitest'

const { menuPress } = vi.hoisted(() => ({
  menuPress: { current: undefined as undefined | ((e: { nativeEvent: ContextMenuOnPressNativeEvent }) => void) },
}))
vi.mock('react-native-context-menu-view', () => ({
  default: ({
    children,
    onPress,
  }: {
    children: React.ReactNode
    onPress: (e: { nativeEvent: ContextMenuOnPressNativeEvent }) => void
  }) => {
    menuPress.current = onPress
    return children
  },
}))

const { mockToggleVisibility, mockReportPosition } = vi.hoisted(() => ({
  mockToggleVisibility: vi.fn(),
  mockReportPosition: vi.fn(),
}))
vi.mock('uniswap/src/features/positions/hooks/useTogglePositionVisibility', () => ({
  useTogglePositionVisibility: () => mockToggleVisibility,
}))
vi.mock('uniswap/src/features/positions/hooks/useReportPositionAction', () => ({
  useReportPositionAction: () => mockReportPosition,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('uniswap/src/features/telemetry/send')

const position = (overrides?: Partial<PositionInfo>): PositionInfo =>
  ({ status: PositionStatus.IN_RANGE, isHidden: false, ...overrides }) as unknown as PositionInfo

function renderMenu(positionInfo: PositionInfo, isVisible = true): void {
  renderWithProviders(
    <PositionItemContextMenu positionInfo={positionInfo} isVisible={isVisible}>
      <Text>row</Text>
    </PositionItemContextMenu>,
  )
}

describe('PositionItemContextMenu (native)', () => {
  const mockSendAnalyticsEvent = sendAnalyticsEvent as Mock

  beforeEach(() => {
    vi.clearAllMocks()
    menuPress.current = undefined
  })

  it('fires ContextMenuItemClicked and runs the hide action when the first item is pressed', () => {
    renderMenu(position())

    menuPress.current?.({ nativeEvent: { index: 0, name: 'position.hide', indexPath: [0] } })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      UniswapEventName.ContextMenuItemClicked,
      expect.objectContaining({
        element: ElementName.LiquidityPositionContextMenu,
        section: SectionName.PortfolioPoolsTab,
        menu_item: 'position.hide',
        menu_item_index: 0,
      }),
    )
    expect(mockToggleVisibility).toHaveBeenCalledTimes(1)
  })

  it('reports the correct menu_item for the report action', () => {
    renderMenu(position())

    menuPress.current?.({ nativeEvent: { index: 1, name: 'nft.reportSpam', indexPath: [1] } })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      UniswapEventName.ContextMenuItemClicked,
      expect.objectContaining({ menu_item: 'nft.reportSpam', menu_item_index: 1 }),
    )
    expect(mockReportPosition).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the pressed index has no matching action', () => {
    // A hidden position only has the unhide action, so index 1 is out of range.
    renderMenu(position({ isHidden: true }), false)

    menuPress.current?.({ nativeEvent: { index: 1, name: 'missing', indexPath: [1] } })

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
    expect(mockToggleVisibility).not.toHaveBeenCalled()
    expect(mockReportPosition).not.toHaveBeenCalled()
  })
})
