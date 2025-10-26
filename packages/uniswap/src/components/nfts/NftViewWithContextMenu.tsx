import { useCallback, useMemo } from 'react'
import { Flex } from 'ui/src'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { NftView, NftViewProps } from 'uniswap/src/components/nfts/NftView'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useNFTContextMenuItems } from 'uniswap/src/features/nfts/hooks/useNftContextMenuItems'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { isWebPlatform } from 'utilities/src/platform'
import { noop } from 'utilities/src/react/noop'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export type NftViewWithContextMenuProps = NftViewProps & {
  owner: Address
}

export function NftViewWithContextMenu(props: NftViewWithContextMenuProps): JSX.Element {
  const { value: contextMenuIsOpen, setFalse: closeContextMenu, setTrue: openContextMenu } = useBooleanState(false)
  const { item, owner, walletAddresses } = props
  const { hapticFeedback } = useHapticFeedback()

  const menuItems = useNFTContextMenuItems({
    contractAddress: item.contractAddress,
    tokenId: item.tokenId,
    owner,
    walletAddresses,
    isSpam: item.isSpam,
    showNotification: true,
    chainId: fromGraphQLChain(item.chain) ?? undefined,
  })

  const openContextMenuWithHaptics = useCallback(async () => {
    await hapticFeedback.light().catch(noop)
    openContextMenu()
  }, [hapticFeedback, openContextMenu])

  const onOpenContextMenu = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const nftViewWithTriggers = useMemo(() => {
    const nftView = <NftView {...props} openContextMenu={openContextMenuWithHaptics} />
    return isWebPlatform ? (
      // biome-ignore  lint/correctness/noRestrictedElements: needed here
      <div onContextMenu={onOpenContextMenu}>{nftView}</div>
    ) : (
      nftView
    )
  }, [onOpenContextMenu, openContextMenuWithHaptics, props])

  return (
    <Flex>
      <ContextMenu
        menuItems={menuItems}
        triggerMode={isWebPlatform ? ContextMenuTriggerMode.Primary : ContextMenuTriggerMode.Secondary}
        isOpen={contextMenuIsOpen}
        closeMenu={closeContextMenu}
      >
        {nftViewWithTriggers}
      </ContextMenu>
    </Flex>
  )
}
