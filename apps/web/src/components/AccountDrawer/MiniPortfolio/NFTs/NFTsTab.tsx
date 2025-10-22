import { SharedEventName } from '@uniswap/analytics-events'
import { SolanaOnlyEmptyState } from 'components/AccountDrawer/MiniPortfolio/SolanaOnlyEmptyState'
import { useAccount } from 'hooks/useAccount'
import { useCallback, useMemo } from 'react'
import { Flex } from 'ui/src'
import { NftsList } from 'uniswap/src/components/nfts/NftsList'
import { NftViewWithContextMenu } from 'uniswap/src/components/nfts/NftViewWithContextMenu'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export default function NftsTab({ owner }: { owner: Address }): JSX.Element {
  const account = useAccount()
  const { evmAddress, svmAddress } = useActiveAddresses()

  const isSolanaOnlyWallet = Boolean(svmAddress && !evmAddress)

  const renderNFTItem = useCallback(
    (item: NFTItem) => {
      const onPress = (): void => {
        sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
          element: ElementName.MiniPortfolioNftItem,
          collection_name: item.collectionName,
          collection_address: item.contractAddress,
          token_id: item.tokenId,
        })
      }

      return (
        <Flex fill m="$spacing4" testID={`${TestID.MiniPortfolioNftItem}-${item.contractAddress}-${item.tokenId}`}>
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

  // Custom empty state that shows Solana message when both wallets connected
  const customEmptyState = useMemo(() => {
    if (svmAddress && evmAddress) {
      return (
        <Flex centered pt="$spacing48" px="$spacing36" style={defaultEmptyStyle}>
          <SolanaOnlyEmptyState tab="nfts" showConnectButton={false} />
        </Flex>
      )
    }
    return undefined // Use NftsList's default empty state
  }, [svmAddress, evmAddress])

  // If Solana-only wallet, show Solana-only empty state with EVM connect button
  if (isSolanaOnlyWallet) {
    return (
      <Flex mx="$spacing12">
        <SolanaOnlyEmptyState tab="nfts" showConnectButton />
      </Flex>
    )
  }

  return (
    <Flex mx="$spacing12">
      <NftsList
        emptyStateStyle={defaultEmptyStyle}
        errorStateStyle={defaultEmptyStyle}
        owner={owner}
        renderNFTItem={renderNFTItem}
        customEmptyState={customEmptyState}
      />
    </Flex>
  )
}

const defaultEmptyStyle = {
  minHeight: 100,
  paddingVertical: '$spacing12',
  width: '100%',
}
