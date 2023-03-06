/* eslint-disable import/no-unused-modules */
import { t, Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import {
  CollectionSelectedAssetIcon,
  LooksRareIcon,
  Nft20Icon,
  NftXIcon,
  OpenSeaMarketplaceIcon,
  ProfileSelectedAssetIcon,
  SudoSwapIcon,
  X2y2Icon,
} from 'nft/components/icons'
import { Markets, UniformAspectRatio, UniformAspectRatios } from 'nft/types'
import { putCommas } from 'nft/utils'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Pause, Play } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'
import { colors } from 'theme/colors'

const BORDER_RADIUS = '12'

const SuspiciousIcon = styled(AlertTriangle)`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.accentFailure};
`

const StyledImageContainer = styled.div<{ isDisabled?: boolean }>`
  position: relative;
  pointer-events: auto;
  &:hover {
    opacity: ${({ isDisabled, theme }) => (isDisabled ? theme.opacity.disabled : theme.opacity.enabled)};
  }
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
`

const StyledActionButton = styled(ThemedText.BodySmall)<{ selected: boolean; isDisabled: boolean }>`
  position: absolute;
  display: flex;
  width: 100%;
  padding: 8px 0px;
  color: ${({ theme }) => theme.accentTextLightPrimary};
  background: ${({ theme, selected }) => (selected ? theme.accentCritical : theme.accentAction)};
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} opacity`};
  will-change: opacity;
  border-radius: 8px;
  justify-content: center;
  font-weight: 600 !important;
  line-height: 16px;
  opacity: 0;
  cursor: pointer;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    ${({ isDisabled }) => `opacity: ${isDisabled ? 0 : 1};`}
  }
`

const ActionButton = ({
  isDisabled,
  isSelected,
  clickActionButton,
  children,
}: {
  isDisabled: boolean
  isSelected: boolean
  clickActionButton: (e: React.MouseEvent) => void
  children: ReactNode
}) => {
  return (
    <StyledActionButton selected={isSelected} isDisabled={isDisabled} onClick={clickActionButton}>
      {children}
    </StyledActionButton>
  )
}

const StyledCardContainer = styled.div<{ selected: boolean; isDisabled: boolean }>`
  position: relative;
  border-radius: ${BORDER_RADIUS}px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  overflow: hidden;
  padding-bottom: 20px;
  box-shadow: ${({ theme }) => theme.shallowShadow};
  box-sizing: border-box;
  -webkit-box-sizing: border-box;
  isolation: isolate;

  :after {
    content: '';
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    border: ${({ selected }) => (selected ? '3px' : '1px')} solid;
    border-radius: ${BORDER_RADIUS}px;
    border-color: ${({ theme, selected }) => (selected ? theme.accentAction : theme.backgroundOutline)};
    pointer-events: none;

    @media screen and (max-width: ${BREAKPOINTS.sm}px) {
      ${({ selected, theme }) => selected && `border-color: ${theme.accentCritical}`};
    }
  }

  :hover::after {
    ${({ selected, theme }) => selected && `border-color: ${theme.accentCritical}`};
  }

  :hover {
    ${StyledActionButton} {
      opacity: ${({ isDisabled }) => (isDisabled ? 0 : 1)};
    }
  }
`

const CardContainer = ({
  isSelected,
  isDisabled,
  children,
}: {
  isSelected: boolean
  isDisabled: boolean
  children: ReactNode
}) => {
  return (
    <StyledCardContainer selected={isSelected} isDisabled={isDisabled} draggable={false}>
      {children}
    </StyledCardContainer>
  )
}

const StyledLink = styled(Link)`
  text-decoration: none;
`

const Container = ({
  isSelected,
  isDisabled,
  detailsHref,
  doNotLinkToDetails = false,
  children,
}: {
  isSelected: boolean
  isDisabled: boolean
  detailsHref: string
  doNotLinkToDetails: boolean
  children: ReactNode
}) => {
  return (
    <CardContainer isSelected={isSelected} isDisabled={isDisabled}>
      <StyledLink to={doNotLinkToDetails ? '' : detailsHref}>{children}</StyledLink>
    </CardContainer>
  )
}

const ImageContainer = ({ isDisabled, children }: { isDisabled: boolean; children: ReactNode }) => {
  return <StyledImageContainer isDisabled={isDisabled}>{children}</StyledImageContainer>
}

const handleUniformAspectRatio = (
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

    if (uniformAspectRatio === UniformAspectRatios.unset) {
      setUniformAspectRatio(aspectRatio >= 1 ? UniformAspectRatios.square : aspectRatio)
    } else if (uniformAspectRatio !== aspectRatio) {
      setUniformAspectRatio(UniformAspectRatios.square)
      setRenderedHeight && setRenderedHeight(undefined)
    }
  }
}

function getHeightFromAspectRatio(uniformAspectRatio: UniformAspectRatio, renderedHeight?: number): number | undefined {
  return uniformAspectRatio === UniformAspectRatios.square || uniformAspectRatio === UniformAspectRatios.unset
    ? undefined
    : renderedHeight
}

function getMediaAspectRatio(
  uniformAspectRatio?: UniformAspectRatio,
  setUniformAspectRatio?: (uniformAspectRatio: UniformAspectRatio) => void
): string {
  return uniformAspectRatio === UniformAspectRatios.square || !setUniformAspectRatio ? '1' : 'auto'
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
  border-top-left-radius: ${BORDER_RADIUS}px;
  border-top-right-radius: ${BORDER_RADIUS}px;
`

const StyledImage = styled.img<{
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
    imageLoading && `linear-gradient(270deg, ${theme.backgroundOutline} 0%, ${theme.backgroundSurface} 100%)`};

  ${StyledCardContainer}:hover & {
    transform: scale(1.15);
  }
`

const Image = ({
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
  mediaSrc?: string
  tokenId?: string
  shouldPlay: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
}

const PlaybackButton = styled.div<{ pauseButton?: boolean }>`
  display: ${({ pauseButton }) => (pauseButton ? 'block' : 'none')};
  color: ${({ theme }) => theme.accentTextLightPrimary};
  position: absolute;
  height: 40px;
  width: 40px;
  z-index: 1;
  margin-left: calc(100% - 50px);
  transform: translateY(-56px);

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

const Video = ({
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
  const vidRef = useRef<HTMLVideoElement>(null)
  const [noContent, setNoContent] = useState(!src)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (shouldPlay && vidRef.current) {
      vidRef.current.play()
    } else if (!shouldPlay && vidRef.current) {
      vidRef.current.pause()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldPlay, vidRef.current])

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
          $hidden={shouldPlay}
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
            <StyledVideo
              $aspectRatio={getMediaAspectRatio(uniformAspectRatio, setUniformAspectRatio)}
              ref={vidRef}
              onEnded={(e) => {
                e.preventDefault()
                setCurrentTokenPlayingMedia(undefined)
              }}
              loop
              playsInline
            >
              <source src={mediaSrc} />
            </StyledVideo>
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

const StyledAudio = styled.audio`
  width: 100%;
  height: 100%;
`

const Audio = ({
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
  const audRef = useRef<HTMLAudioElement>(null)
  const [noContent, setNoContent] = useState(!src)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (shouldPlay && audRef.current) {
      audRef.current.play()
    } else if (!shouldPlay && audRef.current) {
      audRef.current.pause()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldPlay, audRef.current])

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
            setImageLoaded(true)
          }}
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
            <StyledAudio
              ref={audRef}
              onEnded={(e) => {
                e.preventDefault()
                setCurrentTokenPlayingMedia(undefined)
              }}
            >
              <source src={mediaSrc} />
            </StyledAudio>
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

interface CardDetailsContainerProps {
  children: ReactNode
}

const StyledDetailsContainer = styled(Column)`
  position: relative;
  padding: 16px 16px 0px;
  justify-content: space-between;
  gap: 8px;
`

const DetailsContainer = ({ children }: CardDetailsContainerProps) => {
  return <StyledDetailsContainer>{children}</StyledDetailsContainer>
}

const StyledInfoContainer = styled(Column)`
  gap: 4px;
  overflow: hidden;
  width: 100%;
`

const InfoContainer = ({ children }: { children: ReactNode }) => {
  return <StyledInfoContainer>{children}</StyledInfoContainer>
}

const StyledPrimaryRow = styled(Row)`
  gap: 8px;
  justify-content: space-between;
`

const PrimaryRow = ({ children }: { children: ReactNode }) => <StyledPrimaryRow>{children}</StyledPrimaryRow>

const StyledPrimaryDetails = styled(Row)`
  justify-items: center;
  overflow: hidden;
  white-space: nowrap;
  gap: 8px;
`

const PrimaryDetails = ({ children }: { children: ReactNode }) => (
  <StyledPrimaryDetails>{children}</StyledPrimaryDetails>
)

const PrimaryInfoContainer = styled(ThemedText.BodySmall)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 600 !important;
  line-height: 20px;
`

const PrimaryInfo = ({ children }: { children: ReactNode }) => {
  return <PrimaryInfoContainer>{children}</PrimaryInfoContainer>
}

const StyledSecondaryRow = styled(Row)`
  justify-content: space-between;
`

const SecondaryRow = ({ children }: { children: ReactNode }) => <StyledSecondaryRow>{children}</StyledSecondaryRow>

const StyledSecondaryDetails = styled(Row)`
  overflow: hidden;
  white-space: nowrap;
`

const SecondaryDetails = ({ children }: { children: ReactNode }) => (
  <StyledSecondaryDetails>{children}</StyledSecondaryDetails>
)

const SecondaryInfoContainer = styled(ThemedText.BodyPrimary)`
  color: ${({ theme }) => theme.textPrimary};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 24px;
`

const SecondaryInfo = ({ children }: { children: ReactNode }) => {
  return <SecondaryInfoContainer>{children}</SecondaryInfoContainer>
}

const StyledTertiaryInfoContainer = styled.div`
  position: relative;
  height: 20px;
`

const TertiaryInfoContainer = ({ children }: { children: ReactNode }) => {
  return <StyledTertiaryInfoContainer>{children}</StyledTertiaryInfoContainer>
}

const StyledTertiaryInfo = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.textSecondary};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 20px;
`

const TertiaryInfo = ({ children }: { children: ReactNode }) => {
  return <StyledTertiaryInfo>{children}</StyledTertiaryInfo>
}

const StyledMarketplaceIcon = styled.img`
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
  margin-left: 8px;
  vertical-align: top;
`

const MarketplaceIcon = ({ marketplace }: { marketplace: string }) => {
  return <StyledMarketplaceIcon alt={marketplace} src={`/nft/svgs/marketplaces/${marketplace}.svg`} />
}

interface RankingProps {
  provider: { url?: string; rank?: number }
}

const RarityInfo = styled(ThemedText.Caption)`
  flex-shrink: 0;
  color: ${({ theme }) => theme.textSecondary};
  background: ${({ theme }) => theme.backgroundInteractive};
  padding: 4px 6px;
  border-radius: 4px;
  font-weight: 700 !important;
  line-height: 12px;
  text-align: right;
  cursor: auto;
`

const Ranking = ({ provider }: RankingProps) => {
  if (!provider.rank) {
    return null
  }

  return <RarityInfo># {putCommas(provider.rank)}</RarityInfo>
}

const SUSPICIOUS_TEXT = t`Blocked on OpenSea`

const SuspiciousIconContainer = styled(Row)`
  flex-shrink: 0;
`

const Suspicious = () => {
  return (
    <MouseoverTooltip text={<ThemedText.BodySmall>{SUSPICIOUS_TEXT}</ThemedText.BodySmall>} placement="top">
      <SuspiciousIconContainer>
        <SuspiciousIcon />
      </SuspiciousIconContainer>
    </MouseoverTooltip>
  )
}

const StyledMarketplaceContainer = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
`

function getMarketplaceIcon(market: Markets): ReactNode {
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
    default:
      return null
  }
}

const MarketplaceContainer = ({
  isSelected,
  marketplace,
  tokenType,
}: {
  isSelected: boolean
  marketplace?: Markets
  tokenType?: NftStandard
}) => {
  if (isSelected) {
    if (!marketplace) {
      return (
        <StyledMarketplaceContainer>
          <ProfileSelectedAssetIcon />
        </StyledMarketplaceContainer>
      )
    }

    return (
      <StyledMarketplaceContainer>
        <CollectionSelectedAssetIcon />
      </StyledMarketplaceContainer>
    )
  }

  if (!marketplace) {
    return null
  }

  if (!tokenType || tokenType === NftStandard.Erc1155) {
    return null
  }

  return <StyledMarketplaceContainer>{getMarketplaceIcon(marketplace)}</StyledMarketplaceContainer>
}

const NoContentContainerBackground = styled.div<{ height?: number }>`
  position: relative;
  width: 100%;
  height: ${({ height }) => (height ? `${height}px` : 'auto')};
  padding-top: 100%;
  background: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.backgroundSurface} 0%, ${theme.backgroundInteractive} 95.83%)`};
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
    <NoContentContainerBackground height={height}>
      <NoContentText>
        <Trans>Content not</Trans>
        <br />
        <Trans>available yet</Trans>
      </NoContentText>
    </NoContentContainerBackground>
  </>
)

export {
  ActionButton,
  Audio,
  Container,
  DetailsContainer,
  Image,
  ImageContainer,
  InfoContainer,
  MarketplaceContainer,
  MarketplaceIcon,
  PrimaryDetails,
  PrimaryInfo,
  PrimaryRow,
  Ranking,
  SecondaryDetails,
  SecondaryInfo,
  SecondaryRow,
  Suspicious,
  TertiaryInfo,
  TertiaryInfoContainer,
  Video,
}
