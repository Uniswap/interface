import { memo } from 'react'
import { Flex, TouchableArea } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useLiquidityPositionDropdownOptions } from '~/features/Liquidity/hooks/useLiquidityPositionDropdownOptions'

const ICON_BUTTON_SIZE = 28

interface LiquidityPositionDropdownMenuProps {
  liquidityPosition: PositionInfo
  showVisibilityOption?: boolean
  isVisible?: boolean
  readOnly?: boolean
}

export const LiquidityPositionDropdownMenu = memo(function LiquidityPositionDropdownMenu({
  liquidityPosition,
  showVisibilityOption = true,
  isVisible = true,
  readOnly = false,
}: LiquidityPositionDropdownMenuProps) {
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu, toggle } = useBooleanState(false)
  const dropdownOptions = useLiquidityPositionDropdownOptions({
    liquidityPosition,
    showVisibilityOption,
    isVisible,
    readOnly,
  })

  return (
    <ContextMenu
      trackItemClicks
      menuItems={dropdownOptions}
      triggerMode={ContextMenuTriggerMode.Primary}
      isOpen={isOpen}
      openMenu={openMenu}
      closeMenu={closeMenu}
      elementName={ElementName.LiquidityPositionContextMenu}
      sectionName={SectionName.PortfolioPoolsTab}
    >
      {/* oxlint-disable-next-line react/forbid-elements -- raw div needed for onContextMenu */}
      <div style={{ cursor: 'pointer' }} onContextMenu={toggle}>
        <TouchableArea
          onPressIn={(e) => e.stopPropagation()}
          onPressOut={(e) => e.stopPropagation()}
          onPress={(e) => {
            e.stopPropagation()
            e.preventDefault()
            toggle()
          }}
        >
          <Flex aria-label="View pool options" centered mr="$spacing8" ml="$spacing4">
            <Flex height={ICON_BUTTON_SIZE} width={ICON_BUTTON_SIZE} borderRadius="$rounded12" centered>
              <MoreHorizontal size="$icon.16" color="$neutral2" />
            </Flex>
          </Flex>
        </TouchableArea>
      </div>
    </ContextMenu>
  )
})
