import { GenieAsset } from 'nft/types'
import { isAudio, isVideo } from 'nft/utils'
import { useState } from 'react'
import styled, { css } from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'

const MediaStyle = css`
  position: relative;
  object-fit: contain;
  height: 100%;
  width: 100%;
  aspect-ratio: 1;
  z-index: 1;
`

const StyledImage = styled.img`
  ${MediaStyle}
`

const StyledVideo = styled.video`
  ${MediaStyle}
`

const MediaShadow = styled.img`
  object-fit: contain;
  height: 100%;
  aspect-ratio: 1;
  border-radius: 20px;
  filter: blur(25px);

  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    filter: blur(50px);
  }
`

const MediaShadowContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`

const StyledEmbed = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
  padding-top: 100%;
  z-index: 1;
`

const StyledIFrame = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
`

const AudioContainer = styled.div`
  position: relative;
`

const StyledAudio = styled.audio`
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 2;
  width: 100%;
`

const AudioPlayer = ({ asset, onError }: { asset: GenieAsset; onError: () => void }) => {
  return (
    <AudioContainer>
      <StyledImage
        src={asset.imageUrl}
        alt={asset.name ?? asset.collectionName + ' #' + asset.tokenId}
        onError={onError}
      />
      <StyledAudio controls src={asset.animationUrl} onError={onError} />
    </AudioContainer>
  )
}

const EmbeddedMediaPlayer = ({ asset, onError }: { asset: GenieAsset; onError: () => void }) => {
  return (
    <StyledEmbed>
      <StyledIFrame
        title={asset.name ?? `${asset.collectionName} #${asset.tokenId}`}
        src={asset.animationUrl}
        frameBorder={0}
        sandbox="allow-scripts"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        onError={onError}
      />
    </StyledEmbed>
  )
}

const ContentNotAvailable = styled(ThemedText.BodySmall)`
  display: flex;
  background-color: ${({ theme }) => theme.backgroundSurface};
  color: ${({ theme }) => theme.textSecondary};
  align-items: center;
  justify-content: center;

  ${MediaStyle}
`

// TODO: when assets query is moved to nxyz update with mediaType from the query
enum MediaType {
  Audio = 'audio',
  Video = 'video',
  Image = 'image',
  Raw = 'raw',
}

function assetMediaType(asset: GenieAsset): MediaType {
  if (isAudio(asset.animationUrl ?? '')) {
    return MediaType.Audio
  } else if (isVideo(asset.animationUrl ?? '')) {
    return MediaType.Video
  } else if (asset.animationUrl) {
    return MediaType.Raw
  }
  return MediaType.Image
}

const RenderMediaShadow = ({ imageUrl }: { imageUrl?: string }) => {
  const [contentNotAvailable, setContentNotAvailable] = useState(false)

  if (!imageUrl || contentNotAvailable) {
    return null
  }

  return (
    <MediaShadowContainer>
      <MediaShadow src={imageUrl} onError={() => setContentNotAvailable(true)} />
    </MediaShadowContainer>
  )
}

const RenderMediaType = ({ asset }: { asset: GenieAsset }) => {
  const [contentNotAvailable, setContentNotAvailable] = useState(false)

  if (contentNotAvailable) {
    return <ContentNotAvailable>Content not available</ContentNotAvailable>
  }

  switch (assetMediaType(asset)) {
    case MediaType.Image:
      return (
        <StyledImage
          src={asset.imageUrl}
          alt={asset.name || asset.collectionName}
          onError={() => setContentNotAvailable(true)}
        />
      )
    case MediaType.Video:
      return (
        <StyledVideo
          src={asset.animationUrl}
          autoPlay
          controls
          muted
          loop
          onError={() => setContentNotAvailable(true)}
        />
      )
    case MediaType.Audio:
      return <AudioPlayer asset={asset} onError={() => setContentNotAvailable(true)} />
    case MediaType.Raw:
      return <EmbeddedMediaPlayer asset={asset} onError={() => setContentNotAvailable(true)} />
  }
}

export const MediaRenderer = ({ asset }: { asset: GenieAsset }) => (
  <>
    <RenderMediaType asset={asset} />
    <RenderMediaShadow imageUrl={asset.imageUrl} />
  </>
)
