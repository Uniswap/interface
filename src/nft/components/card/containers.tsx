import { t, Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import {
  CollectionSelectedAssetIcon,
  LarvaLabsMarketplaceIcon,
  LooksRareIcon,
  Nft20Icon,
  NftXIcon,
  OpenSeaMarketplaceIcon,
  ProfileSelectedAssetIcon,
  SudoSwapIcon,
  TagIcon,
  X2y2Icon,
} from 'nft/components/icons'
import { Markets, UniformAspectRatio, UniformAspectRatios } from 'nft/types'
import { putCommas } from 'nft/utils'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Pause, Play } from 'react-feather'
import { Link } from 'react-router-dom'
import { useDarkModeManager } from 'state/user/hooks'
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

const StyledDetailsRelativeContainer = styled.div`
  position: relative;
  height: 84px;
`

const StyledDetailsContainer = styled(Column)`
  position: absolute;
  width: 100%;
  padding: 16px 8px 0px;
  justify-content: space-between;
  gap: 8px;
  height: 84px;
  background: ${({ theme }) => theme.backgroundSurface};
  will-change: transform;
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} transform`};

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    height: 112px;
    transform: translateY(-28px);
  }
`

const StyledActionButton = styled(ThemedText.BodySmall)<{
  selected: boolean
  isDisabled: boolean
}>`
  position: absolute;
  display: flex;
  padding: 8px 0px;
  bottom: -32px;
  left: 8px;
  right: 8px;
  color: ${({ theme, isDisabled }) => (isDisabled ? theme.textPrimary : theme.accentTextLightPrimary)};
  background: ${({ theme, selected, isDisabled }) =>
    selected ? theme.accentCritical : isDisabled ? theme.backgroundInteractive : theme.accentAction};
  transition: ${({ theme }) =>
    `${theme.transition.duration.medium} ${theme.transition.timing.ease} bottom, ${theme.transition.duration.medium} ${theme.transition.timing.ease} visibility`};
  will-change: transform;
  border-radius: 8px;
  justify-content: center;
  font-weight: 600 !important;
  line-height: 16px;
  visibility: hidden;
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    visibility: visible;
    bottom: 8px;
  }

  &:before {
    background-size: 100%;
    border-radius: inherit;

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
    content: '';
  }

  &:hover:before {
    background-color: ${({ theme, isDisabled }) => !isDisabled && theme.stateOverlayHover};
  }

  &:active:before {
    background-color: ${({ theme, isDisabled }) => !isDisabled && theme.stateOverlayPressed};
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
    <StyledActionButton
      selected={isSelected}
      isDisabled={isDisabled}
      onClick={(e: React.MouseEvent) => (isDisabled ? undefined : clickActionButton(e))}
    >
      {children}
    </StyledActionButton>
  )
}

const StyledCardContainer = styled.div<{ selected: boolean; isDisabled: boolean; isLightMode: boolean }>`
  position: relative;
  border-radius: ${BORDER_RADIUS}px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  overflow: hidden;
  box-shadow: 0px 0px 8px rgba(51, 53, 72, 0.04), 1px 2px 4px rgba(51, 53, 72, 0.12);
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
    border: ${({ selected, isLightMode }) => (selected ? '3px' : isLightMode ? '0px' : '1px')} solid;
    border-radius: ${BORDER_RADIUS}px;
    border-color: ${({ theme, selected }) => (selected ? theme.accentAction : theme.backgroundOutline)};
    pointer-events: none;
    transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} border`};
    will-change: border;

    @media screen and (max-width: ${BREAKPOINTS.sm}px) {
      ${({ selected, theme }) => selected && `border-color: ${theme.accentCritical}`};
    }
  }

  :hover::after {
    ${({ selected, theme }) => selected && `border-color: ${theme.accentCritical}`};
  }

  :hover {
    ${StyledActionButton} {
      visibility: visible;
      bottom: 8px;
    }

    ${StyledDetailsContainer} {
      height: 112px;
      transform: translateY(-28px);
    }
  }
`

const CardContainer = ({
  isSelected,
  isDisabled,
  children,
  testId,
}: {
  isSelected: boolean
  isDisabled: boolean
  children: ReactNode
  testId?: string
}) => {
  const [darkMode] = useDarkModeManager()

  return (
    <StyledCardContainer
      selected={isSelected}
      isDisabled={isDisabled}
      draggable={false}
      data-testid={testId}
      isLightMode={!darkMode}
    >
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
  testId,
  children,
}: {
  isSelected: boolean
  isDisabled: boolean
  detailsHref: string
  doNotLinkToDetails: boolean
  testId?: string
  children: ReactNode
}) => {
  return (
    <CardContainer isSelected={isSelected} isDisabled={isDisabled} testId={testId}>
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

    const variance = 0.05
    if (uniformAspectRatio === UniformAspectRatios.unset) {
      setUniformAspectRatio(aspectRatio >= 1 ? UniformAspectRatios.square : aspectRatio)
    } else if (aspectRatio > uniformAspectRatio + variance || aspectRatio < uniformAspectRatio - variance) {
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

const DetailsRelativeContainer = ({ children }: { children: ReactNode }) => {
  return <StyledDetailsRelativeContainer>{children}</StyledDetailsRelativeContainer>
}

const DetailsContainer = ({ children }: { children: ReactNode }) => {
  return <StyledDetailsContainer>{children}</StyledDetailsContainer>
}

const StyledInfoContainer = styled(Column)`
  gap: 4px;
  overflow: hidden;
  width: 100%;
  padding: 0px 8px;
  height: 48px;
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

interface RankingProps {
  provider: { url?: string; rank?: number }
}

const RarityLogoContainer = styled(Row)`
  margin-right: 8px;
  width: 16px;
`

const RarityText = styled(ThemedText.BodySmall)`
  display: flex;
`

const RarityInfo = styled(ThemedText.Caption)`
  flex-shrink: 0;
  color: ${({ theme }) => theme.textSecondary};
  background: ${({ theme }) => theme.backgroundInteractive};
  padding: 4px 6px;
  border-radius: 4px;
  font-weight: 700 !important;
  line-height: 12px;
  text-align: right;
  cursor: pointer;
`

const Ranking = ({ provider }: RankingProps) => {
  if (!provider.rank) {
    return null
  }

  return (
    <RarityInfo>
      <MouseoverTooltip
        text={
          <Row>
            <RarityLogoContainer>
              <img src="/nft/svgs/gem.svg" width={16} height={16} />
            </RarityLogoContainer>
            <RarityText>Ranking by Rarity Sniper</RarityText>
          </Row>
        }
        placement="top"
      >
        # {putCommas(provider.rank)}
      </MouseoverTooltip>
    </RarityInfo>
  )
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

const StyledMarketplaceContainer = styled.div<{ isText?: boolean }>`
  position: absolute;
  display: flex;
  top: 12px;
  left: 12px;
  height: 32px;
  width: ${({ isText }) => (isText ? 'auto' : '32px')};
  padding: ${({ isText }) => (isText ? '0px 8px' : '0px')};
  background: rgba(93, 103, 133, 0.24);
  justify-content: center;
  align-items: center;
  border-radius: 32px;
  z-index: 2;
`

const ListPriceRowContainer = styled(Row)`
  gap: 6px;
  color: ${({ theme }) => theme.accentTextLightPrimary};
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
`

function getMarketplaceIcon(market: Markets): ReactNode {
  switch (market) {
    case Markets.Opensea:
      return <OpenSeaMarketplaceIcon width="20px" height="20px" />
    case Markets.LooksRare:
      return <LooksRareIcon width="20px" height="20px" />
    case Markets.X2Y2:
      return <X2y2Icon width="20px" height="20px" />
    case Markets.Sudoswap:
      return <SudoSwapIcon width="20px" height="20px" />
    case Markets.NFT20:
      return <Nft20Icon width="20px" height="20px" />
    case Markets.NFTX:
      return <NftXIcon width="20px" height="20px" />
    case Markets.Cryptopunks:
      return <LarvaLabsMarketplaceIcon width="20px" height="20px" />
    default:
      return null
  }
}

const MarketplaceContainer = ({
  isSelected,
  marketplace,
  tokenType,
  listedPrice,
}: {
  isSelected: boolean
  marketplace?: Markets
  tokenType?: NftStandard
  listedPrice?: string
}) => {
  if (isSelected) {
    if (!marketplace) {
      return (
        <StyledMarketplaceContainer>
          <ProfileSelectedAssetIcon width="20px" height="20px" />
        </StyledMarketplaceContainer>
      )
    }

    return (
      <StyledMarketplaceContainer>
        <CollectionSelectedAssetIcon width="20px" height="20px" viewBox="0 0 20 20" />
      </StyledMarketplaceContainer>
    )
  }

  if (listedPrice) {
    return (
      <StyledMarketplaceContainer isText={true}>
        <ListPriceRowContainer>
          <TagIcon width="20px" height="20px" />
          {listedPrice} ETH
        </ListPriceRowContainer>
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
  DetailsRelativeContainer,
  Image,
  ImageContainer,
  InfoContainer,
  MarketplaceContainer,
  PrimaryDetails,
  PrimaryInfo,
  PrimaryRow,
  Ranking,
  SecondaryDetails,
  SecondaryInfo,
  SecondaryRow,
  Suspicious,
  Video,
}
