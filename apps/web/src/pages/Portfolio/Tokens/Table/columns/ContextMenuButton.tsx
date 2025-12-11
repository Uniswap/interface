import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokensContextMenuWrapper } from 'pages/Portfolio/Tokens/Table/TokensContextMenuWrapper'
import { memo } from 'react'
import { Flex, useIsTouchDevice } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'

const ICON_BUTTON_SIZE = 28

interface ContextMenuButtonProps {
  tokenData: TokenData
}

export const ContextMenuButton = memo(function ContextMenuButton({ tokenData }: ContextMenuButtonProps) {
  const isTouchDevice = useIsTouchDevice()

  return (
    <TokensContextMenuWrapper tokenData={tokenData} triggerMode={ContextMenuTriggerMode.Primary}>
      <Flex
        aria-label="View transaction details"
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
          animation="fast"
        >
          <MoreHorizontal size="$icon.16" color="$neutral2" />
        </Flex>
      </Flex>
    </TokensContextMenuWrapper>
  )
})
