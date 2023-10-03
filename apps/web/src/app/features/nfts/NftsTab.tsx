import { useCallback } from 'react'
import { Flex } from 'ui/src'
import { NftsList } from 'wallet/src/components/nfts/NftsList'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { ESTIMATED_NFT_LIST_ITEM_SIZE } from 'wallet/src/features/nfts/constants'
import { NFTItem } from 'wallet/src/features/nfts/types'

export function NftsTab({ owner }: { owner: Address }): JSX.Element {
  const renderNFTItem = useCallback((item: NFTItem) => {
    return (
      <Flex
        borderRadius="$rounded16"
        cursor="pointer"
        gap="$none"
        justifyContent="flex-start"
        p="$spacing4"
        width="100%"
        onPress={(): void => {
          if (item.contractAddress && item.tokenId) {
            const url = `https://app.uniswap.org/nfts/asset/${item.contractAddress}/${item.tokenId}`
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            window.open(url, '_blank')
          }
        }}>
        <Flex
          alignItems="center"
          aspectRatio={1}
          backgroundColor="$surface3"
          borderRadius="$rounded12"
          overflow="hidden"
          width="100%">
          <NFTViewer
            imageDimensions={item.imageDimensions}
            limitGIFSize={ESTIMATED_NFT_LIST_ITEM_SIZE}
            placeholderContent={item.name || item.collectionName}
            squareGridView={true}
            uri={item.imageUrl ?? ''}
          />
        </Flex>
      </Flex>
    )
  }, [])

  const defaultEmptyStyle = {
    minHeight: 100,
    paddingVertical: '$spacing12',
    width: '100%',
  }
  return (
    <NftsList
      emptyStateStyle={defaultEmptyStyle}
      errorStateStyle={defaultEmptyStyle}
      owner={owner}
      renderNFTItem={renderNFTItem}
    />
  )
}
