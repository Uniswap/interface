import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { memo } from 'react'
import { rowPressExemptProps } from 'uniswap/src/components/lists/items/OptionItemPressableArea'
import {
  PoolContextMenuAction,
  PoolOptionItemContextMenu,
} from 'uniswap/src/components/lists/items/pools/PoolOptionItemContextMenu'
import { ContextMenuTriggerButton } from 'uniswap/src/components/menus/ContextMenuTriggerButton'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useDelayedMenuClose } from 'uniswap/src/features/search/SearchModal/hooks/useDelayedMenuClose'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

// Context menu button component that manages its own state
export const PoolRowContextMenuButton = memo(function PoolRowContextMenuButton({
  poolId,
  chainId,
  protocolVersion,
  isVisible = true,
}: {
  poolId: string
  chainId: UniverseChainId
  protocolVersion: ProtocolVersion
  isVisible?: boolean
}): JSX.Element {
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)
  useDelayedMenuClose({ isVisible, isOpen, closeMenu })

  const shouldShow = isVisible || isOpen

  return (
    <Flex opacity={shouldShow ? 1 : 0} pointerEvents={shouldShow ? 'auto' : 'none'} {...rowPressExemptProps}>
      <PoolOptionItemContextMenu
        actions={[PoolContextMenuAction.CopyAddress, PoolContextMenuAction.Share]}
        isOpen={isOpen}
        openMenu={openMenu}
        closeMenu={closeMenu}
        poolId={poolId}
        chainId={chainId}
        protocolVersion={protocolVersion}
        triggerMode={ContextMenuTriggerMode.Primary}
      >
        <ContextMenuTriggerButton />
      </PoolOptionItemContextMenu>
    </Flex>
  )
})
