import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import { getHeightFromAspectRatio, getMediaAspectRatio, handleUniformAspectRatio } from 'nft/components/card/utils'
import { UniformAspectRatio, UniformAspectRatios } from 'nft/types'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'react-feather'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { colors } from 'theme/colors'
import { ThemedText } from 'theme/components'

const StyledImageContainer = styled.div<{ isDisabled?: boolean }>`
  position: relative;
  pointer-events: auto;
  &:hover {
    opacity: ${({ isDisabled, theme }) => (isDisabled ? theme.opacity.disabled : theme.opacity.enabled)};
  }
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
`

export const MediaContainer = ({ isDisabled, children }: { isDisabled: boolean; children: ReactNode }) => {
  return <StyledImageContainer isDisabled={isDisabled}>{children}</StyledImageContainer>
}

interface ImageProps {
  src?: string
  uniformAspectRatio?: UniformAspectRatio
  setUniformAspectRatio?: (uniformAspectRatio: UniformAspectRatio) => void
  renderedHeight?: number
  setRenderedHeight?: (renderedHeight: number | undefined) => void
}

const StyledMediaContainer = styled(Row)`
  overflow: hidden;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
`

export const StyledImage = styled.img<{
  imageLoading: boolean
  $aspectRatio?: string
  $hidden?: boolean
}>`
  width: 100%;
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio};
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} transform`};
  will-change: transform;
  object-fit: contain;
  visibility: ${({ $hidden }) => ($hidden ? 'hidden' : 'visible')};
  background: ${({ theme, imageLoading }) =>
    imageLoading && `linear-gradient(270deg, ${theme.surface3} 0%, ${theme.surface1} 100%)`};
`

export const NftImage = ({
  src,
  uniformAspectRatio = UniformAspectRatios.square,
  setUniformAspectRatio,
  renderedHeight,
  setRenderedHeight,
}: ImageProps) => {
  const [noContent, setNoContent] = useState(!src)
  const [loaded, setLoaded] = useState(false)

  if (noContent) {
    return <NoContentContainer height={getHeightFromAspectRatio(uniformAspectRatio, renderedHeight)} />
  }

  return (
    <StyledMediaContainer>
      <StyledImage
        src={src}
        $aspectRatio={getMediaAspectRatio(uniformAspectRatio, setUniformAspectRatio)}
        imageLoading={!loaded}
        draggable={false}
        onError={() => setNoContent(true)}
        onLoad={(e) => {
          handleUniformAspectRatio(uniformAspectRatio, e, setUniformAspectRatio, renderedHeight, setRenderedHeight)
          setLoaded(true)
        }}
      />
    </StyledMediaContainer>
  )
}

interface MediaProps {
  isAudio?: boolean
  mediaSrc?: string
  tokenId?: string
  shouldPlay: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
}

const PlaybackButton = styled.div<{ pauseButton?: boolean }>`
  display: ${({ pauseButton }) => (pauseButton ? 'block' : 'none')};
  color: ${({ theme }) => theme.accent1};
  position: absolute;
  height: 40px;
  width: 40px;
  z-index: 1;
  margin-left: calc(100% - 50px);
  transform: translateY(-76px);

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: block;
  }

  ${StyledImageContainer}:hover & {
    display: block;
  }
`

const StyledVideo = styled.video<{
  $aspectRatio?: string
}>`
  width: 100%;
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio};
`

const StyledInnerMediaContainer = styled(Row)`
  position: absolute;
  left: 0px;
  top: 0px;
`

const StyledAudio = styled.audio`
  width: 100%;
  height: 100%;
`

export const NftPlayableMedia = ({
  isAudio,
  src,
  mediaSrc,
  tokenId,
  uniformAspectRatio = UniformAspectRatios.square,
  setUniformAspectRatio,
  renderedHeight,
  setRenderedHeight,
  shouldPlay,
  setCurrentTokenPlayingMedia,
}: MediaProps & ImageProps) => {
  const mediaRef = useRef<HTMLVideoElement>(null)
  const [noContent, setNoContent] = useState(!src)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (shouldPlay && mediaRef.current) {
      mediaRef.current.play()
    } else if (!shouldPlay && mediaRef.current) {
      mediaRef.current.pause()
    }
  }, [shouldPlay])

  if (noContent) {
    return <NoContentContainer height={getHeightFromAspectRatio(uniformAspectRatio, renderedHeight)} />
  }

  return (
    <>
      <StyledMediaContainer>
        <StyledImage
          src={src}
          $aspectRatio={getMediaAspectRatio(uniformAspectRatio, setUniformAspectRatio)}
          imageLoading={!imageLoaded}
          draggable={false}
          onError={() => setNoContent(true)}
          onLoad={(e) => {
            handleUniformAspectRatio(uniformAspectRatio, e, setUniformAspectRatio, renderedHeight, setRenderedHeight)
            setImageLoaded(true)
          }}
          $hidden={shouldPlay && !isAudio}
        />
      </StyledMediaContainer>
      {shouldPlay ? (
        <>
          <PlaybackButton pauseButton={true}>
            <Pause
              size="24px"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentTokenPlayingMedia(undefined)
              }}
            />
          </PlaybackButton>
          <StyledInnerMediaContainer>
            {isAudio ? (
              <StyledAudio
                ref={mediaRef}
                onEnded={(e) => {
                  e.preventDefault()
                  setCurrentTokenPlayingMedia(undefined)
                }}
              >
                <source src={mediaSrc} />
              </StyledAudio>
            ) : (
              <StyledVideo
                $aspectRatio={getMediaAspectRatio(uniformAspectRatio, setUniformAspectRatio)}
                ref={mediaRef}
                onEnded={(e) => {
                  e.preventDefault()
                  setCurrentTokenPlayingMedia(undefined)
                }}
                loop
                playsInline
              >
                <source src={mediaSrc} />
              </StyledVideo>
            )}
          </StyledInnerMediaContainer>
        </>
      ) : (
        <PlaybackButton>
          <Play
            size="24px"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setCurrentTokenPlayingMedia(tokenId)
            }}
          />
        </PlaybackButton>
      )}
    </>
  )
}

const NoContentContainerBackground = styled.div<{ $height?: number }>`
  position: relative;
  width: 100%;
  height: ${({ $height }) => ($height ? `${$height}px` : 'auto')};
  padding-top: 100%;
  background: ${({ theme }) => `linear-gradient(90deg, ${theme.surface1} 0%, ${theme.surface3} 95.83%)`};
`

const NoContentText = styled(ThemedText.BodyPrimary)`
  position: absolute;
  text-align: center;
  left: 50%;
  top: 50%;
  transform: translate3d(-50%, -50%, 0);
  color: ${colors.gray500};
`

const NoContentContainer = ({ height }: { height?: number }) => (
  <>
    <NoContentContainerBackground $height={height}>
      <NoContentText>
        <Trans>Content not</Trans>
        <br />
        <Trans>available yet</Trans>
      </NoContentText>
    </NoContentContainerBackground>
  </>
)
