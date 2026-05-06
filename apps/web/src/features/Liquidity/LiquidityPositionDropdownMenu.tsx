import { memo } from 'react'
import { Flex, TouchableArea, useIsTouchDevice } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useLiquidityPositionDropdownOptions } from '~/features/Liquidity/hooks/useLiquidityPositionDropdownOptions'
import { PositionInfo } from '~/types/liquidity'

const ICON_BUTTON_SIZE = 28

interface LiquidityPositionDropdownMenuProps {
  liquidityPosition: PositionInfo
  showVisibilityOption?: boolean
  isVisible?: boolean
}

export const LiquidityPositionDropdownMenu = memo(function LiquidityPositionDropdownMenu({
  liquidityPosition,
  showVisibilityOption = true,
  isVisible = true,
}: LiquidityPositionDropdownMenuProps) {
  const isTouchDevice = useIsTouchDevice()
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu, toggle } = useBooleanState(false)
  const dropdownOptions = useLiquidityPositionDropdownOptions({
    liquidityPosition,
    showVisibilityOption,
    isVisible,
  })

  return (
    <ContextMenu
      trackItemClicks
      menuItems={dropdownOptions}
      triggerMode={ContextMenuTriggerMode.Primary}
      isOpen={isOpen}
      openMenu={openMenu}
      closeMenu={closeMenu}
      elementName={ElementName.PortfolioPoolContextMenu}
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
          <Flex
            aria-label="View pool options"
            opacity={isTouchDevice ? 1 : 0}
            transition="opacity 0.2s ease"
            centered
            $group-hover={{ opacity: 1 }}
            $group-focus={{ opacity: 1 }}
            mr="$spacing8"
            ml="$spacing4"
          >
            <Flex
              height={ICON_BUTTON_SIZE}
              width={ICON_BUTTON_SIZE}
              borderRadius="$rounded12"
              hoverStyle={{ backgroundColor: '$surface3' }}
              centered
              animateOnly={['opacity', 'transform']}
            >
              <MoreHorizontal size="$icon.16" color="$neutral2" />
            </Flex>
          </Flex>
        </TouchableArea>
      </div>
    </ContextMenu>
  )
})
