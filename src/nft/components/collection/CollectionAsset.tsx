import { BigNumber } from '@ethersproject/bignumber'
import * as Card from 'nft/components/collection/Card'
import { GenieAsset } from 'nft/types'
import { formatWeiToDecimal } from 'nft/utils/currency'
import { isAudio } from 'nft/utils/isAudio'
import { isVideo } from 'nft/utils/isVideo'
import { MouseEvent, useMemo } from 'react'

enum AssetMediaType {
  Image,
  Video,
  Audio,
}

interface CollectionAssetProps {
  asset: GenieAsset
  mediaShouldBePlaying: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
}

export const CollectionAsset = ({ asset, mediaShouldBePlaying, setCurrentTokenPlayingMedia }: CollectionAssetProps) => {
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
    <Card.Container asset={asset}>
      {assetMediaType === AssetMediaType.Image ? (
        <Card.Image />
      ) : assetMediaType === AssetMediaType.Video ? (
        <Card.Video shouldPlay={mediaShouldBePlaying} setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia} />
      ) : (
        <Card.Audio shouldPlay={mediaShouldBePlaying} setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia} />
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
          selectedChildren={'Remove'}
          onClick={(e: MouseEvent) => {
            e.preventDefault()
          }}
          onSelectedClick={(e: MouseEvent) => {
            e.preventDefault()
          }}
        >
          {'Buy now'}
        </Card.Button>
      </Card.DetailsContainer>
    </Card.Container>
  )
}
