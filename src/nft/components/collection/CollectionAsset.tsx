import { BigNumber } from '@ethersproject/bignumber'
import { useBag } from 'nft/hooks'
import { GenieAsset, Markets, UniformHeight } from 'nft/types'
import { formatWeiToDecimal, isAudio, isVideo, rarityProviderLogo } from 'nft/utils'
import { useMemo } from 'react'

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
  const addAssetsToBag = useBag((state) => state.addAssetsToBag)
  const removeAssetsFromBag = useBag((state) => state.removeAssetsFromBag)
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

    notForSale = asset.notForSale || BigNumber.from(asset.priceInfo.ETHPrice ? asset.priceInfo.ETHPrice : 0).lt(0)
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
    <Card.Container
      asset={asset}
      selected={isSelected}
      addAssetToBag={() => {
        addAssetsToBag([asset])
        !bagExpanded && !isMobile && toggleBag()
      }}
      removeAssetFromBag={() => {
        removeAssetsFromBag([asset])
      }}
    >
      <Card.ImageContainer>
        {asset.tokenType === 'ERC1155' && quantity > 0 && <Card.Erc1155Controls quantity={quantity.toString()} />}
        {asset.rarity && provider && provider.rank && (
          <Card.Ranking
            rarity={asset.rarity}
            provider={provider}
            rarityVerified={!!rarityVerified}
            rarityLogo={rarityLogo}
          />
        )}
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
      </Card.ImageContainer>
      <Card.DetailsContainer>
        <Card.InfoContainer>
          <Card.PrimaryRow>
            <Card.PrimaryDetails>
              <Card.PrimaryInfo>{asset.name ? asset.name : `#${asset.tokenId}`}</Card.PrimaryInfo>
              {asset.susFlag && <Card.Suspicious />}
            </Card.PrimaryDetails>
            <Card.DetailsLink />
          </Card.PrimaryRow>
          <Card.SecondaryRow>
            <Card.SecondaryDetails>
              <Card.SecondaryInfo>
                {notForSale ? '' : `${formatWeiToDecimal(asset.priceInfo.ETHPrice, true)} ETH`}
              </Card.SecondaryInfo>
              {(asset.marketplace === Markets.NFTX || asset.marketplace === Markets.NFT20) && <Card.Pool />}
            </Card.SecondaryDetails>
            {asset.tokenType !== 'ERC1155' && asset.marketplace && (
              <Card.MarketplaceIcon marketplace={asset.marketplace} />
            )}
          </Card.SecondaryRow>
        </Card.InfoContainer>
      </Card.DetailsContainer>
    </Card.Container>
  )
}
