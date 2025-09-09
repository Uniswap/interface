import { useAccount } from 'hooks/useAccount'
import { useCallback } from 'react'
import { Flex } from 'ui/src'
import { NftViewWithContextMenu } from 'uniswap/src/components/nfts/NftViewWithContextMenu'
import { NftsList } from 'uniswap/src/components/nfts/NftsList'
import { NFTItem } from 'uniswap/src/features/nfts/types'

export default function NftsTabShared({ owner, skip }: { owner: Address; skip?: boolean }): JSX.Element {
  const account = useAccount()

  const renderNFTItem = useCallback(
    (item: NFTItem) => {
      const onPress = (): void => {
        // TODO add analytics
      }

      return (
        <Flex fill m="$spacing4">
          <NftViewWithContextMenu
            walletAddresses={account.address ? [account.address] : []}
            item={item}
            owner={owner}
            onPress={onPress}
          />
        </Flex>
      )
    },
    [account.address, owner],
  )

  return (
    <Flex mx="$spacing12">
      <NftsList
        emptyStateStyle={defaultEmptyStyle}
        errorStateStyle={defaultEmptyStyle}
        owner={owner}
        renderNFTItem={renderNFTItem}
        skip={skip}
      />
    </Flex>
  )
}

const defaultEmptyStyle = {
  minHeight: 100,
  paddingVertical: '$spacing12',
  width: '100%',
}
