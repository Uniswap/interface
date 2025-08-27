import { Flex } from 'ui/src'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { NftView, NftViewProps } from 'uniswap/src/components/nfts/NftView'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useNFTContextMenuItems } from 'uniswap/src/features/nfts/hooks/useNftContextMenuItems'
import { isWeb } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export type NftViewWithContextMenuProps = NftViewProps & {
  owner: Address
}

export function NftViewWithContextMenu(props: NftViewWithContextMenuProps): JSX.Element {
  const { value: contextMenuIsOpen, setFalse: closeContextMenu, setTrue: openContextMenu } = useBooleanState(false)
  const { item, owner, walletAddresses } = props

  const menuItems = useNFTContextMenuItems({
    contractAddress: item.contractAddress,
    tokenId: item.tokenId,
    owner,
    walletAddresses,
    isSpam: item.isSpam,
    showNotification: true,
    chainId: fromGraphQLChain(item.chain) ?? undefined,
  })

  return (
    <Flex>
      <ContextMenu
        menuItems={menuItems}
        triggerMode={isWeb ? ContextMenuTriggerMode.Primary : ContextMenuTriggerMode.Secondary}
        isOpen={contextMenuIsOpen}
        closeMenu={closeContextMenu}
      >
        <NftView {...props} openContextMenu={openContextMenu} />
      </ContextMenu>
    </Flex>
  )
}
