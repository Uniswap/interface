import { Flex, Text } from 'ui/src'
import { NFTViewer } from 'uniswap/src/components/nfts/NFTViewer'
import {
  NFTApproveTransactionInfo,
  NFTMintTransactionInfo,
  NFTSummaryInfo,
  NFTTradeTransactionInfo,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'

const MAX_NFT_IMAGE_HEIGHT = 375

export function NftTransactionDetails({
  typeInfo,
}: {
  typeInfo:
    | ReceiveTokenTransactionInfo
    | SendTokenTransactionInfo
    | NFTTradeTransactionInfo
    | NFTMintTransactionInfo
    | NFTApproveTransactionInfo
}): JSX.Element {
  if (!typeInfo.nftSummaryInfo) {
    return <></>
  }

  return <NftTransactionContent nftSummaryInfo={typeInfo.nftSummaryInfo} />
}

export function NftTransactionContent({ nftSummaryInfo }: { nftSummaryInfo: NFTSummaryInfo }): JSX.Element {
  return (
    <Flex borderRadius="$rounded20" overflow="hidden">
      <Flex aspectRatio={1} width="100%">
        <NFTViewer maxHeight={MAX_NFT_IMAGE_HEIGHT} uri={nftSummaryInfo.imageURL} />
      </Flex>
      <Flex
        borderBottomLeftRadius="$rounded20"
        borderBottomRightRadius="$rounded20"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderTopWidth={0}
        p="$spacing12"
      >
        <Text variant="subheading2">{nftSummaryInfo.name}</Text>
        <Flex row pr="$spacing12">
          <Text color="$neutral2" numberOfLines={1} variant="body3">
            {nftSummaryInfo.collectionName}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
