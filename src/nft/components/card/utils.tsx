import { NftImage, NftPlayableMedia } from 'nft/components/card/media'
import {
  LarvaLabsMarketplaceIcon,
  LooksRareIcon,
  Nft20Icon,
  NftXIcon,
  OpenSeaMarketplaceIcon,
  SudoSwapIcon,
  X2y2Icon,
} from 'nft/components/icons'
import { GenieAsset, Markets, UniformAspectRatio, UniformAspectRatios, WalletAsset } from 'nft/types'
import { isAudio, isVideo } from 'nft/utils'
import { ReactNode, useCallback } from 'react'

enum AssetMediaType {
  Image,
  Video,
  Audio,
}

function getAssetImageUrl(asset: GenieAsset | WalletAsset) {
  return asset.imageUrl || asset.smallImageUrl
}

function getAssetMediaUrl(asset: GenieAsset | WalletAsset) {
  return asset.animationUrl
}

export function detailsHref(asset: GenieAsset | WalletAsset) {
  if ('address' in asset) return `/nfts/asset/${asset.address}/${asset.tokenId}?origin=collection`
  if ('asset_contract' in asset) return `/nfts/asset/${asset.asset_contract.address}/${asset.tokenId}?origin=profile`
  return '/nfts/profile'
}

function getAssetMediaType(asset: GenieAsset | WalletAsset) {
  let assetMediaType = AssetMediaType.Image
  if (asset.animationUrl) {
    if (isAudio(asset.animationUrl)) {
      assetMediaType = AssetMediaType.Audio
    } else if (isVideo(asset.animationUrl)) {
      assetMediaType = AssetMediaType.Video
    }
  }
  return assetMediaType
}

export function getNftDisplayComponent(
  asset: GenieAsset | WalletAsset,
  mediaShouldBePlaying: boolean,
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void,
  uniformAspectRatio?: UniformAspectRatio,
  setUniformAspectRatio?: (uniformAspectRatio: UniformAspectRatio) => void,
  renderedHeight?: number,
  setRenderedHeight?: (renderedHeight: number | undefined) => void
) {
  switch (getAssetMediaType(asset)) {
    case AssetMediaType.Image:
      return (
        <NftImage
          src={getAssetImageUrl(asset)}
          uniformAspectRatio={uniformAspectRatio}
          setUniformAspectRatio={setUniformAspectRatio}
          renderedHeight={renderedHeight}
          setRenderedHeight={setRenderedHeight}
        />
      )
    case AssetMediaType.Video:
      return (
        <NftPlayableMedia
          src={getAssetImageUrl(asset)}
          mediaSrc={getAssetMediaUrl(asset)}
          tokenId={asset.tokenId}
          shouldPlay={mediaShouldBePlaying}
          setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
          uniformAspectRatio={uniformAspectRatio}
          setUniformAspectRatio={setUniformAspectRatio}
          renderedHeight={renderedHeight}
          setRenderedHeight={setRenderedHeight}
        />
      )
    case AssetMediaType.Audio:
      return (
        <NftPlayableMedia
          isAudio={true}
          src={getAssetImageUrl(asset)}
          mediaSrc={getAssetMediaUrl(asset)}
          tokenId={asset.tokenId}
          shouldPlay={mediaShouldBePlaying}
          setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
          uniformAspectRatio={uniformAspectRatio}
          setUniformAspectRatio={setUniformAspectRatio}
          renderedHeight={renderedHeight}
          setRenderedHeight={setRenderedHeight}
        />
      )
  }
}

export function useSelectAsset({
  selectAsset,
  unselectAsset,
  isSelected,
  isDisabled,
  onClick,
}: {
  selectAsset?: () => void
  unselectAsset?: () => void
  isSelected: boolean
  isDisabled: boolean
  onClick?: () => void
}) {
  return useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      if (isDisabled) {
        return
      }

      if (onClick) {
        onClick()
        return
      }

      return isSelected ? unselectAsset?.() : selectAsset?.()
    },
    [selectAsset, isDisabled, onClick, unselectAsset, isSelected]
  )
}

export function getMarketplaceIcon(market: Markets): ReactNode {
  switch (market) {
    case Markets.Opensea:
      return <OpenSeaMarketplaceIcon />
    case Markets.LooksRare:
      return <LooksRareIcon />
    case Markets.X2Y2:
      return <X2y2Icon />
    case Markets.Sudoswap:
      return <SudoSwapIcon />
    case Markets.NFT20:
      return <Nft20Icon />
    case Markets.NFTX:
      return <NftXIcon />
    case Markets.Cryptopunks:
      return <LarvaLabsMarketplaceIcon />
    default:
      return null
  }
}

export const handleUniformAspectRatio = (
  uniformAspectRatio: UniformAspectRatio,
  e: React.SyntheticEvent<HTMLElement, Event>,
  setUniformAspectRatio?: (uniformAspectRatio: UniformAspectRatio) => void,
  renderedHeight?: number,
  setRenderedHeight?: (renderedHeight: number | undefined) => void
) => {
  if (uniformAspectRatio !== UniformAspectRatios.square && setUniformAspectRatio) {
    const height = e.currentTarget.clientHeight
    const width = e.currentTarget.clientWidth
    const aspectRatio = width / height

    if (
      (!renderedHeight || renderedHeight !== height) &&
      aspectRatio < 1 &&
      uniformAspectRatio !== UniformAspectRatios.square &&
      setRenderedHeight
    ) {
      setRenderedHeight(height)
    }

    const variance = 0.05
    if (uniformAspectRatio === UniformAspectRatios.unset) {
      setUniformAspectRatio(aspectRatio >= 1 ? UniformAspectRatios.square : aspectRatio)
    } else if (aspectRatio > uniformAspectRatio + variance || aspectRatio < uniformAspectRatio - variance) {
      setUniformAspectRatio(UniformAspectRatios.square)
      setRenderedHeight && setRenderedHeight(undefined)
    }
  }
}

export function getHeightFromAspectRatio(
  uniformAspectRatio: UniformAspectRatio,
  renderedHeight?: number
): number | undefined {
  return uniformAspectRatio === UniformAspectRatios.square || uniformAspectRatio === UniformAspectRatios.unset
    ? undefined
    : renderedHeight
}

export function getMediaAspectRatio(
  uniformAspectRatio?: UniformAspectRatio,
  setUniformAspectRatio?: (uniformAspectRatio: UniformAspectRatio) => void
): string {
  return uniformAspectRatio === UniformAspectRatios.square || !setUniformAspectRatio ? '1' : 'auto'
}
