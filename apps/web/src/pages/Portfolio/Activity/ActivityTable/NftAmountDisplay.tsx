import { TableText } from 'components/Table/styled'
import { memo } from 'react'
import { Flex, styled } from 'ui/src'
import { NFTViewer } from 'uniswap/src/components/nfts/images/NFTViewer'

interface NftAmountDisplayProps {
  nftImageUrl?: string
  nftName: string
  nftCollectionName?: string
  purchaseAmountText?: string | null
}

const NftImageContainer = styled(Flex, {
  width: 40,
  height: 40,
  borderRadius: '$rounded8',
  overflow: 'hidden',
  backgroundColor: '$surface3',
})

function _NftAmountDisplay({
  nftImageUrl,
  nftName,
  nftCollectionName,
  purchaseAmountText,
}: NftAmountDisplayProps): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$gap12">
      {nftImageUrl && (
        <NftImageContainer>
          <NFTViewer
            uri={nftImageUrl}
            placeholderContent={nftName || nftCollectionName}
            maxHeight={40}
            svgRenderingDisabled
          />
        </NftImageContainer>
      )}
      <Flex gap="$gap2">
        <TableText variant="body3" fontWeight="500">
          {nftName}
        </TableText>
        {nftCollectionName && (
          <TableText variant="body3" color="$neutral2">
            {nftCollectionName}
          </TableText>
        )}
        {purchaseAmountText && (
          <TableText variant="body3" color="$neutral2">
            {purchaseAmountText}
          </TableText>
        )}
      </Flex>
    </Flex>
  )
}

export const NftAmountDisplay = memo(_NftAmountDisplay)
