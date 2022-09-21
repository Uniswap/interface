import { BigNumber } from '@ethersproject/bignumber'
import { useBag } from 'nft/hooks'
import { GenieAsset, UniformHeight } from 'nft/types'
import { formatWeiToDecimal } from 'nft/utils/currency'
import { isAudio } from 'nft/utils/isAudio'
import { isVideo } from 'nft/utils/isVideo'
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
}

export const CollectionAsset = ({
  asset,
  isMobile,
  uniformHeight,
  setUniformHeight,
  mediaShouldBePlaying,
  setCurrentTokenPlayingMedia,
}: CollectionAssetProps) => {
  const { addAssetToBag, removeAssetFromBag, itemsInBag, bagExpanded, toggleBag } = useBag((state) => ({
    addAssetToBag: state.addAssetToBag,
    removeAssetFromBag: state.removeAssetFromBag,
    itemsInBag: state.itemsInBag,
    bagExpanded: state.bagExpanded,
    toggleBag: state.toggleBag,
  }))

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
            </Card.PrimaryDetails>
          </Card.PrimaryRow>
          <Card.SecondaryRow>
            <Card.SecondaryDetails>
              <Card.SecondaryInfo>
                {notForSale ? '' : `${formatWeiToDecimal(asset.currentEthPrice)} ETH`}
              </Card.SecondaryInfo>
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
