import { Flex, Text, TouchableArea, isWeb } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  NFTApproveTransactionInfo,
  NFTMintTransactionInfo,
  NFTSummaryInfo,
  NFTTradeTransactionInfo,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'

const MAX_NFT_IMAGE_HEIGHT = 375

export function NftTransactionDetails({
  transactionDetails,
  typeInfo,
  onClose,
}: {
  transactionDetails: TransactionDetails
  typeInfo:
    | ReceiveTokenTransactionInfo
    | SendTokenTransactionInfo
    | NFTTradeTransactionInfo
    | NFTMintTransactionInfo
    | NFTApproveTransactionInfo
  onClose: () => void
}): JSX.Element {
  if (!typeInfo.nftSummaryInfo) {
    return <></>
  }

  return (
    <NftTransactionContent
      chainId={transactionDetails.chainId}
      nftSummaryInfo={typeInfo.nftSummaryInfo}
      onClose={onClose}
    />
  )
}

export function NftTransactionContent({
  chainId,
  nftSummaryInfo,
  onClose,
}: {
  chainId: UniverseChainId
  nftSummaryInfo: NFTSummaryInfo
  onClose: () => void
}): JSX.Element {
  const { navigateToNftCollection, navigateToNftDetails } = useWalletNavigation()

  const onPressNft = (): void => {
    navigateToNftDetails({
      address: nftSummaryInfo.address,
      tokenId: nftSummaryInfo.tokenId,
    })
    onClose()
  }

  const onPressCollection = (): void => {
    // Collection should not be clickable on L2s
    if (chainId === UniverseChainId.Mainnet) {
      navigateToNftCollection({ collectionAddress: nftSummaryInfo.address })
      onClose()
    }
  }

  const disableOnPressNftItem = isWeb
  const disableOnPressNftCollection = isWeb || chainId !== UniverseChainId.Mainnet

  return (
    <Flex borderRadius="$rounded20" overflow="hidden">
      <TouchableArea cursor="default" disabled={disableOnPressNftItem} onPress={onPressNft}>
        <NFTViewer maxHeight={MAX_NFT_IMAGE_HEIGHT} uri={nftSummaryInfo.imageURL} />
      </TouchableArea>
      <Flex
        borderBottomLeftRadius="$rounded20"
        borderBottomRightRadius="$rounded20"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderTopWidth={0}
        p="$spacing12"
      >
        <Text variant="subheading2">{nftSummaryInfo.name}</Text>
        <TouchableArea cursor="default" disabled={disableOnPressNftCollection} onPress={onPressCollection}>
          <Flex row pr="$spacing12">
            <Text color="$neutral2" numberOfLines={1} variant="body3">
              {nftSummaryInfo.collectionName}
            </Text>
            {!disableOnPressNftCollection && (
              <RotatableChevron
                color="$neutral2"
                direction="right"
                height={iconSizes.icon16}
                width={iconSizes.icon16}
              />
            )}
          </Flex>
        </TouchableArea>
      </Flex>
    </Flex>
  )
}
