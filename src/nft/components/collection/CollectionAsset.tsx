import { BigNumber } from '@ethersproject/bignumber'
import { useBag } from 'nft/hooks'
import { GenieAsset, Markets, UniformHeight } from 'nft/types'
import { formatWeiToDecimal, isAudio, isVideo, rarityProviderLogo } from 'nft/utils'
import { MouseEvent, useMemo } from 'react'

import * as Card from './Card'

enum AssetMediaType {
  Image,
  Video,
  Audio,
}

interface CollectionAssetProps {
  asset: GenieAsset
  isMobile: boolean
  uniformHeight: UniformHeight
  setUniformHeight: (u: UniformHeight) => void
  mediaShouldBePlaying: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
  rarityVerified?: boolean
}

export const CollectionAsset = ({
  asset,
  isMobile,
  uniformHeight,
  setUniformHeight,
  mediaShouldBePlaying,
  setCurrentTokenPlayingMedia,
  rarityVerified,
}: CollectionAssetProps) => {
  const addAssetToBag = useBag((state) => state.addAssetToBag)
  const removeAssetFromBag = useBag((state) => state.removeAssetFromBag)
  const itemsInBag = useBag((state) => state.itemsInBag)
  const bagExpanded = useBag((state) => state.bagExpanded)
  const toggleBag = useBag((state) => state.toggleBag)

  const { quantity, isSelected } = useMemo(() => {
    return {
      quantity: itemsInBag.filter(
        (x) => x.asset.tokenType === 'ERC1155' && x.asset.tokenId === asset.tokenId && x.asset.address === asset.address
      ).length,
      isSelected: itemsInBag.some(
        (item) => asset.tokenId === item.asset.tokenId && asset.address === item.asset.address
      ),
    }
  }, [asset, itemsInBag])

  const { notForSale, assetMediaType } = useMemo(() => {
    let notForSale = true
    let assetMediaType = AssetMediaType.Image

    notForSale = asset.notForSale || BigNumber.from(asset.currentEthPrice ? asset.currentEthPrice : 0).lt(0)
    if (isAudio(asset.animationUrl)) {
      assetMediaType = AssetMediaType.Audio
    } else if (isVideo(asset.animationUrl)) {
      assetMediaType = AssetMediaType.Video
    }

    return {
      notForSale,
      assetMediaType,
    }
  }, [asset])

  const { provider, rarityLogo } = useMemo(() => {
    return {
      provider: asset.rarity?.providers.find(({ provider: _provider }) => _provider === asset.rarity?.primaryProvider),
      rarityLogo: rarityProviderLogo[asset.rarity?.primaryProvider ?? 0] ?? '',
    }
  }, [asset])

  return (
    <Card.Container asset={asset} selected={isSelected}>
      {assetMediaType === AssetMediaType.Image ? (
        <Card.Image uniformHeight={uniformHeight} setUniformHeight={setUniformHeight} />
      ) : assetMediaType === AssetMediaType.Video ? (
        <Card.Video
          uniformHeight={uniformHeight}
          setUniformHeight={setUniformHeight}
          shouldPlay={mediaShouldBePlaying}
          setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
        />
      ) : (
        <Card.Audio
          uniformHeight={uniformHeight}
          setUniformHeight={setUniformHeight}
          shouldPlay={mediaShouldBePlaying}
          setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
        />
      )}
      <Card.DetailsContainer>
        <Card.InfoContainer>
          <Card.PrimaryRow>
            <Card.PrimaryDetails>
              <Card.PrimaryInfo>{asset.name ? asset.name : `#${asset.tokenId}`}</Card.PrimaryInfo>
              {asset.openseaSusFlag && <Card.Suspicious />}
            </Card.PrimaryDetails>
            {asset.rarity && provider && provider.rank && (
              <Card.Ranking
                rarity={asset.rarity}
                provider={provider}
                rarityVerified={!!rarityVerified}
                rarityLogo={rarityLogo}
              />
            )}
          </Card.PrimaryRow>
          <Card.SecondaryRow>
            <Card.SecondaryDetails>
              <Card.SecondaryInfo>
                {notForSale ? '' : `${formatWeiToDecimal(asset.currentEthPrice, true)} ETH`}
              </Card.SecondaryInfo>
              {(asset.marketplace === Markets.NFTX || asset.marketplace === Markets.NFT20) && <Card.Pool />}
            </Card.SecondaryDetails>
            {asset.tokenType !== 'ERC1155' && asset.marketplace && (
              <Card.MarketplaceIcon marketplace={asset.marketplace} />
            )}
          </Card.SecondaryRow>
        </Card.InfoContainer>
        <Card.Button
          quantity={quantity}
          selectedChildren={'Remove'}
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            addAssetToBag(asset)
            !bagExpanded && !isMobile && toggleBag()
          }}
          onSelectedClick={(e: MouseEvent) => {
            e.preventDefault()
            removeAssetFromBag(asset)
          }}
        >
          {'Buy now'}
        </Card.Button>
      </Card.DetailsContainer>
    </Card.Container>
  )
}
