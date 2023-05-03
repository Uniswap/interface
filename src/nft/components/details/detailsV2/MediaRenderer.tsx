import { MediaType } from 'graphql/data/__generated__/types-and-hooks'
import { GenieAsset } from 'nft/types'
import styled, { css } from 'styled-components/macro'
import { ThemedText } from 'theme'

const MediaStyle = css`
  object-fit: contain;
  height: 100%;
  width: 100%;
  aspect-ratio: 1;
`

const StyledImage = styled.img`
  ${MediaStyle}
`

const StyledVideo = styled.video`
  ${MediaStyle}
`

const StyledEmbed = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
  padding-top: 100%;
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
`

const AudioPlayer = ({ asset }: { asset: GenieAsset }) => {
  return (
    <AudioContainer>
      <StyledAudio controls src={asset.animationUrl} />
      <StyledImage src={asset.imageUrl} alt={asset.name || asset.collectionName} />
    </AudioContainer>
  )
}

const EmbeddedMediaPlayer = ({ asset }: { asset: GenieAsset }) => {
  return (
    <StyledEmbed>
      <StyledIFrame
        title={asset.name ?? `${asset.collectionName} #${asset.tokenId}`}
        src={asset.animationUrl}
        frameBorder={0}
        sandbox="allow-scripts"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
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
  width: 100%;
  height: 100%;
`

export const MediaRenderer = ({ asset }: { asset: GenieAsset }) => {
  switch (asset.mediaType) {
    case MediaType.Image:
      return <StyledImage src={asset.imageUrl} alt={asset.name || asset.collectionName} />
    case MediaType.Video:
      return <StyledVideo src={asset.animationUrl} autoPlay controls muted loop />
    case MediaType.Audio:
      return <AudioPlayer asset={asset} />
    case MediaType.Raw:
      return <EmbeddedMediaPlayer asset={asset} />
    default:
      return <ContentNotAvailable>Content not available</ContentNotAvailable>
  }
}
