import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokensContextMenuWrapper } from 'pages/Portfolio/Tokens/Table/TokensContextMenuWrapper'
import { Flex } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'

interface ContextMenuButtonProps {
  tokenData: TokenData
}

export function ContextMenuButton({ tokenData }: ContextMenuButtonProps) {
  return (
    <TokensContextMenuWrapper tokenData={tokenData} triggerMode={ContextMenuTriggerMode.Primary}>
      <Flex opacity={0} transition="opacity 0.2s ease" centered $group-hover={{ opacity: 1 }}>
        <MoreHorizontal size="$icon.16" color="$neutral2" />
      </Flex>
    </TokensContextMenuWrapper>
  )
}
