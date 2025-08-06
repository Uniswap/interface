import { useSelector } from 'react-redux'
import { Flex } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useNFTContextMenu } from 'uniswap/src/features/nfts/useNftContextMenu'
import { getIsNftHidden } from 'uniswap/src/features/nfts/utils'
import { selectNftsVisibility } from 'uniswap/src/features/visibility/selectors'
import { ContextMenu } from 'wallet/src/components/menu/ContextMenu'
import { NftView } from 'wallet/src/components/nfts/NftView'
import { NftViewWithContextMenuProps } from 'wallet/src/components/nfts/NftViewProps'

// WALL-4875 TODO try to combine web and mobile versions
export function NftViewWithContextMenu(props: NftViewWithContextMenuProps): JSX.Element {
  const { defaultChainId } = useEnabledChains()
  const { owner, walletAddresses, item } = props

  const { menuActions } = useNFTContextMenu({
    contractAddress: item.contractAddress,
    tokenId: item.tokenId,
    owner,
    walletAddresses,
    isSpam: item.isSpam,
    showNotification: true,
    chainId: fromGraphQLChain(item.chain) ?? defaultChainId,
  })

  const menuOptions = menuActions.map((action) => ({
    label: action.title,
    onPress: action.onPress,
    Icon: action.Icon,
    destructive: action.destructive,
  }))

  const nftVisibility = useSelector(selectNftsVisibility)
  const hidden = getIsNftHidden({
    contractAddress: item.contractAddress,
    tokenId: item.tokenId,
    isSpam: item.isSpam,
    nftVisibility,
  })

  const itemId = `${item.chain}-${item.contractAddress}-${item.tokenId}-${hidden}`

  return (
    <Flex>
      <ContextMenu closeOnClick itemId={itemId} menuOptions={menuOptions} onLeftClick>
        <NftView {...props} />
      </ContextMenu>
    </Flex>
  )
}
