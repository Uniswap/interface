import { memo } from 'react'
import { Flex, useIsTouchDevice } from 'ui/src'
import { ContextMenuTriggerButton } from 'uniswap/src/components/menus/ContextMenuTriggerButton'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokensContextMenuWrapper } from '~/pages/Portfolio/Tokens/Table/TokensContextMenuWrapper'

interface ContextMenuButtonProps {
  tokenData: TokenData
}

export const ContextMenuButton = memo(function ContextMenuButton({ tokenData }: ContextMenuButtonProps) {
  const isTouchDevice = useIsTouchDevice()

  return (
    <TokensContextMenuWrapper tokenData={tokenData} triggerMode={ContextMenuTriggerMode.Primary}>
      <Flex
        aria-label="View transaction details"
        testID={TestID.TokenTableRowContextMenuButton}
        opacity={isTouchDevice ? 1 : 0}
        transition="opacity 0.2s ease"
        centered
        $group-hover={{ opacity: 1 }}
        $group-focus={{ opacity: 1 }}
        mr="$spacing8"
        ml="$spacing4"
      >
        <ContextMenuTriggerButton />
      </Flex>
    </TokensContextMenuWrapper>
  )
})
