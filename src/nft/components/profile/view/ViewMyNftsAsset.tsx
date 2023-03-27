import { Trans } from '@lingui/macro'
import { useTrace } from '@uniswap/analytics'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { NFTEventName } from '@uniswap/analytics-events'
import { NftCard, NftCardDisplayProps } from 'nft/components/card'
import { detailsHref } from 'nft/components/card/utils'
import { VerifiedIcon } from 'nft/components/icons'
import { useBag, useIsMobile, useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

interface ViewMyNftsAssetProps {
  asset: WalletAsset
  mediaShouldBePlaying: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
  hideDetails: boolean
}

export const ViewMyNftsAsset = ({
  asset,
  mediaShouldBePlaying,
  setCurrentTokenPlayingMedia,
  hideDetails,
}: ViewMyNftsAssetProps) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const removeSellAsset = useSellAsset((state) => state.removeSellAsset)
  const cartExpanded = useBag((state) => state.bagExpanded)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const isSelected = useMemo(() => {
    return sellAssets.some(
      (item) => item.tokenId === asset.tokenId && item.asset_contract.address === asset.asset_contract.address
    )
  }, [asset, sellAssets])

  const trace = useTrace()
  const toggleSelect = () => handleSelect(isSelected)

  const handleSelect = (removeAsset: boolean) => {
    if (removeAsset) {
      removeSellAsset(asset)
    } else {
      selectSellAsset(asset)
      sendAnalyticsEvent(NFTEventName.NFT_SELL_ITEM_ADDED, {
        collection_address: asset.asset_contract.address,
        token_id: asset.tokenId,
        ...trace,
      })
    }
    if (
      !cartExpanded &&
      !sellAssets.find(
        (x) => x.tokenId === asset.tokenId && x.asset_contract.address === asset.asset_contract.address
      ) &&
      !isMobile
    )
      toggleCart()
  }

  const isDisabled = asset.susFlag

  const display: NftCardDisplayProps = useMemo(() => {
    return {
      primaryInfo: !!asset.asset_contract.name && asset.asset_contract.name,
      primaryInfoIcon: asset.collectionIsVerified && <VerifiedIcon height="16px" width="16px" />,
      secondaryInfo: asset.name || asset.tokenId ? asset.name ?? `#${asset.tokenId}` : null,
      selectedInfo: <Trans>Remove from bag</Trans>,
      notSelectedInfo: <Trans>List for sale</Trans>,
      disabledInfo: <Trans>Unavailable for listing</Trans>,
    }
  }, [asset.asset_contract.name, asset.collectionIsVerified, asset.name, asset.tokenId])

  return (
    <NftCard
      asset={asset}
      display={display}
      isSelected={isSelected}
      isDisabled={Boolean(isDisabled)}
      selectAsset={() => handleSelect(false)}
      unselectAsset={() => handleSelect(true)}
      onButtonClick={toggleSelect}
      onCardClick={() => {
        if (!hideDetails) navigate(detailsHref(asset))
      }}
      mediaShouldBePlaying={mediaShouldBePlaying}
      setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
      testId="nft-profile-asset"
    />
  )
}
