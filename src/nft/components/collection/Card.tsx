import { BigNumber } from '@ethersproject/bignumber'
import { t, Trans } from '@lingui/macro'
import Column from 'components/Column'
import { OpacityHoverState } from 'components/Common'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import {
  MinusIconLarge,
  PauseButtonIcon,
  PlayButtonIcon,
  PlusIconLarge,
  PoolIcon,
  RarityVerifiedIcon,
  VerifiedIcon,
} from 'nft/components/icons'
import { useIsMobile } from 'nft/hooks'
import { GenieAsset, Rarity, UniformAspectRatio, UniformAspectRatios, WalletAsset } from 'nft/types'
import { fallbackProvider, isAudio, isVideo, putCommas } from 'nft/utils'
import { floorFormatter } from 'nft/utils/numbers'
import {
  createContext,
  MouseEvent,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { AlertTriangle, Pause, Play } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { colors } from 'theme/colors'
import { opacify } from 'theme/utils'

/* -------- ASSET CONTEXT -------- */
export interface CardContextProps {
  asset: GenieAsset | WalletAsset
  hovered: boolean
  selected: boolean
  href: string
  setHref: (href: string) => void
  addAssetToBag: () => void
  removeAssetFromBag: () => void
}

const CardContext = createContext<CardContextProps | undefined>(undefined)

const BORDER_RADIUS = '12'

const useCardContext = () => {
  const context = useContext(CardContext)
  if (!context) throw new Error('Must use context inside of provider')
  return context
}

export enum AssetMediaType {
  Image,
  Video,
  Audio,
}

const useNotForSale = (asset: GenieAsset) =>
  useMemo(() => {
    let notForSale = true
    notForSale = asset.notForSale || BigNumber.from(asset.priceInfo ? asset.priceInfo.ETHPrice : 0).lt(0)
    return notForSale
  }, [asset])

const useAssetMediaType = (asset: GenieAsset | WalletAsset) =>
  useMemo(() => {
    let assetMediaType = AssetMediaType.Image
    if (asset.animationUrl) {
      if (isAudio(asset.animationUrl)) {
        assetMediaType = AssetMediaType.Audio
      } else if (isVideo(asset.animationUrl)) {
        assetMediaType = AssetMediaType.Video
      }
    }
    return assetMediaType
  }, [asset])

const baseHref = (asset: GenieAsset | WalletAsset) => {
  if ('address' in asset) return `/#/nfts/asset/${asset.address}/${asset.tokenId}?origin=collection`
  if ('asset_contract' in asset) return `/#/nfts/asset/${asset.asset_contract.address}/${asset.tokenId}?origin=profile`
  return '/#/nfts/profile'
}

const DetailsLinkContainer = styled.a`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid;
  color: ${({ theme }) => theme.accentAction};
  border-color: ${({ theme }) => theme.accentActionSoft};
  padding: 2px 6px;
  border-radius: 6px;
  ${OpacityHoverState};
`

const SuspiciousIcon = styled(AlertTriangle)`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.accentFailure};
`

const Erc1155ControlsRow = styled.div`
  position: absolute;
  display: flex;
  width: 100%;
  bottom: 12px;
  z-index: 2;
  justify-content: center;
`

const Erc1155ControlsContainer = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: ${BORDER_RADIUS}px;
  overflow: hidden;
`

const Erc1155ControlsDisplay = styled(ThemedText.HeadlineSmall)`
  display: flex;
  padding: 6px 8px;
  width: 60px;
  background: ${({ theme }) => theme.backgroundBackdrop};
  justify-content: center;
  cursor: default;
`

const Erc1155ControlsInput = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  background: ${({ theme }) => theme.backgroundInteractive};
  color: ${({ theme }) => theme.textPrimary};

  :hover {
    color: ${({ theme }) => theme.accentAction};
  }
`

const RankingContainer = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
`

const StyledImageContainer = styled.div<{ isDisabled?: boolean }>`
  position: relative;
  pointer-events: auto;
  &:hover {
    opacity: ${({ isDisabled, theme }) => (isDisabled ? theme.opacity.disabled : theme.opacity.enabled)};
  }
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
`

const CardContainer = styled.div<{ selected: boolean }>`
  position: relative;
  border-radius: ${BORDER_RADIUS}px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  overflow: hidden;
  padding-bottom: 12px;
  border-radius: 16px;
  box-shadow: rgba(0, 0, 0, 10%) 0px 4px 12px;
  box-sizing: border-box;
  -webkit-box-sizing: border-box;

  :after {
    content: '';
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    border: ${({ selected }) => (selected ? '2px' : '1px')} solid;
    border-radius: 16px;
    border-color: ${({ theme, selected }) => (selected ? theme.accentAction : opacify(12, colors.gray500))};
    pointer-events: none;
  }
`

/* -------- ASSET CARD -------- */
interface CardProps {
  asset: GenieAsset | WalletAsset
  selected: boolean
  addAssetToBag: () => void
  removeAssetFromBag: () => void
  children: ReactNode
  isDisabled?: boolean
  onClick?: () => void
}

const Container = ({
  asset,
  selected,
  addAssetToBag,
  removeAssetFromBag,
  children,
  isDisabled,
  onClick,
}: CardProps) => {
  const [hovered, toggleHovered] = useReducer((s) => !s, false)
  const [href, setHref] = useState(baseHref(asset))

  const providerValue = useMemo(
    () => ({
      asset,
      selected,
      hovered,
      toggleHovered,
      href,
      setHref,
      addAssetToBag,
      removeAssetFromBag,
    }),
    [asset, hovered, selected, href, addAssetToBag, removeAssetFromBag]
  )

  const assetRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (hovered && assetRef.current?.matches(':hover') === false) toggleHovered()
  }, [hovered])

  const handleAssetInBag = (e: MouseEvent) => {
    if (!asset.notForSale) {
      e.preventDefault()
      !selected ? addAssetToBag() : removeAssetFromBag()
    }
  }

  const toggleHover = useCallback(() => toggleHovered(), [])

  return (
    <CardContext.Provider value={providerValue}>
      <CardContainer
        selected={selected}
        ref={assetRef}
        draggable={false}
        onMouseEnter={toggleHover}
        onMouseLeave={toggleHover}
        onClick={isDisabled ? () => null : onClick ?? handleAssetInBag}
      >
        {children}
      </CardContainer>
    </CardContext.Provider>
  )
}

const ImageContainer = ({ children, isDisabled = false }: { children: ReactNode; isDisabled?: boolean }) => (
  <StyledImageContainer isDisabled={isDisabled}>{children}</StyledImageContainer>
)

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
  hovered: boolean
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
  transform: ${({ hovered }) => hovered && 'scale(1.15)'};
  background: ${({ theme, imageLoading }) =>
    imageLoading && `linear-gradient(270deg, ${theme.backgroundOutline} 0%, ${theme.backgroundSurface} 100%)`};
`

const Image = ({
  uniformAspectRatio = UniformAspectRatios.square,
  setUniformAspectRatio,
  renderedHeight,
  setRenderedHeight,
}: ImageProps) => {
  const { hovered, asset } = useCardContext()
  const [noContent, setNoContent] = useState(!asset.smallImageUrl && !asset.imageUrl)
  const [loaded, setLoaded] = useState(false)
  const isMobile = useIsMobile()

  if (noContent) {
    return <NoContentContainer height={getHeightFromAspectRatio(uniformAspectRatio, renderedHeight)} />
  }

  return (
    <StyledMediaContainer>
      <StyledImage
        src={asset.imageUrl || asset.smallImageUrl}
        $aspectRatio={getMediaAspectRatio(uniformAspectRatio, setUniformAspectRatio)}
        hovered={hovered && !isMobile}
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
  shouldPlay: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
}

const PlaybackButton = styled.div`
  position: absolute;
  height: 40px;
  width: 40px;
  z-index: 1;
  margin-left: calc(100% - 50px);
  transform: translateY(-56px);
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
  uniformAspectRatio = UniformAspectRatios.square,
  setUniformAspectRatio,
  renderedHeight,
  setRenderedHeight,
  shouldPlay,
  setCurrentTokenPlayingMedia,
}: MediaProps & ImageProps) => {
  const vidRef = useRef<HTMLVideoElement>(null)
  const { hovered, asset } = useCardContext()
  const [noContent, setNoContent] = useState(!asset.smallImageUrl && !asset.imageUrl)
  const [imageLoaded, setImageLoaded] = useState(false)
  const isMobile = useIsMobile()

  if (shouldPlay) {
    vidRef.current?.play()
  } else {
    vidRef.current?.pause()
  }

  if (noContent) {
    return <NoContentContainer height={getHeightFromAspectRatio(uniformAspectRatio, renderedHeight)} />
  }

  return (
    <>
      <StyledMediaContainer>
        <StyledImage
          src={asset.imageUrl || asset.smallImageUrl}
          alt={asset.name || asset.tokenId}
          $aspectRatio={getMediaAspectRatio(uniformAspectRatio, setUniformAspectRatio)}
          hovered={hovered && !isMobile}
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
          <PlaybackButton>
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
              <source src={asset.animationUrl} />
            </StyledVideo>
          </StyledInnerMediaContainer>
        </>
      ) : (
        <PlaybackButton>
          {((!isMobile && hovered) || isMobile) && (
            <Play
              size="24px"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentTokenPlayingMedia(asset.tokenId)
              }}
            />
          )}
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
  uniformAspectRatio = UniformAspectRatios.square,
  setUniformAspectRatio,
  renderedHeight,
  setRenderedHeight,
  shouldPlay,
  setCurrentTokenPlayingMedia,
}: MediaProps & ImageProps) => {
  const audRef = useRef<HTMLAudioElement>(null)
  const { hovered, asset } = useCardContext()
  const [noContent, setNoContent] = useState(!asset.smallImageUrl && !asset.imageUrl)
  const [imageLoaded, setImageLoaded] = useState(false)
  const isMobile = useIsMobile()

  if (shouldPlay) {
    audRef.current?.play()
  } else {
    audRef.current?.pause()
  }

  if (noContent) {
    return <NoContentContainer height={getHeightFromAspectRatio(uniformAspectRatio, renderedHeight)} />
  }

  return (
    <>
      <StyledMediaContainer>
        <StyledImage
          src={asset.imageUrl || asset.smallImageUrl}
          alt={asset.name || asset.tokenId}
          $aspectRatio={getMediaAspectRatio(uniformAspectRatio, setUniformAspectRatio)}
          hovered={hovered && !isMobile}
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
          <PlaybackButton>
            <PauseButtonIcon
              width="100%"
              height="100%"
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
              <source src={asset.animationUrl} />
            </StyledAudio>
          </StyledInnerMediaContainer>
        </>
      ) : (
        <PlaybackButton>
          {((!isMobile && hovered) || isMobile) && (
            <PlayButtonIcon
              width="100%"
              height="100%"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentTokenPlayingMedia(asset.tokenId)
              }}
            />
          )}
        </PlaybackButton>
      )}
    </>
  )
}

/* -------- CARD DETAILS CONTAINER -------- */
interface CardDetailsContainerProps {
  children: ReactNode
}

const StyledDetailsContainer = styled(Column)`
  position: relative;
  padding: 12px 12px 0px;
  justify-content: space-between;
  transition: ${({ theme }) => `${theme.transition.duration.medium}`};
`

const DetailsContainer = ({ children }: CardDetailsContainerProps) => {
  return <StyledDetailsContainer>{children}</StyledDetailsContainer>
}

const StyledInfoContainer = styled.div`
  overflow: hidden;
  width: 100%;
`

const InfoContainer = ({ children }: { children: ReactNode }) => {
  return <StyledInfoContainer>{children}</StyledInfoContainer>
}

const TruncatedTextRow = styled(ThemedText.BodySmall)`
  display: flex;
  padding: 2px;
  white-space: pre;
  text-overflow: ellipsis;
  display: block;
  overflow: hidden;
`

const AssetNameRow = styled(TruncatedTextRow)`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 16px !important;
  font-weight: 400;
`

interface ProfileNftDetailsProps {
  asset: WalletAsset
  hideDetails: boolean
}

const PrimaryRowContainer = styled.div`
  overflow: hidden;
  width: 100%;
  flex-wrap: nowrap;
`

const FloorPriceRow = styled(TruncatedTextRow)`
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
`

const ProfileNftDetails = ({ asset, hideDetails }: ProfileNftDetailsProps) => {
  const assetName = () => {
    if (!asset.name && !asset.tokenId) return
    return asset.name ? asset.name : `#${asset.tokenId}`
  }

  const shouldShowUserListedPrice = !asset.notForSale && asset.asset_contract.tokenType !== NftStandard.Erc1155

  return (
    <PrimaryRowContainer>
      <PrimaryRow>
        <PrimaryDetails>
          <TruncatedTextRow color="textSecondary">
            {!!asset.asset_contract.name && <span>{asset.asset_contract.name}</span>}
          </TruncatedTextRow>
          {asset.collectionIsVerified && <VerifiedIcon height="18px" width="18px" />}
        </PrimaryDetails>
        {!hideDetails && <DetailsLink />}
      </PrimaryRow>
      <Row>
        <AssetNameRow>{assetName()}</AssetNameRow>
        {asset.susFlag && <Suspicious />}
      </Row>
      <FloorPriceRow>
        {shouldShowUserListedPrice && asset.floor_sell_order_price
          ? `${floorFormatter(asset.floor_sell_order_price)} ETH`
          : ' '}
      </FloorPriceRow>
    </PrimaryRowContainer>
  )
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
`

const PrimaryDetails = ({ children }: { children: ReactNode }) => (
  <StyledPrimaryDetails>{children}</StyledPrimaryDetails>
)

const PrimaryInfoContainer = styled.div`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
`

const PrimaryInfo = ({ children }: { children: ReactNode }) => {
  return <PrimaryInfoContainer>{children}</PrimaryInfoContainer>
}

const StyledSecondaryRow = styled(Row)`
  height: 20px;
  justify-content: space-between;
  margin-top: 6px;
`

const SecondaryRow = ({ children }: { children: ReactNode }) => <StyledSecondaryRow>{children}</StyledSecondaryRow>

const StyledSecondaryDetails = styled(Row)`
  overflow: hidden;
  white-space: nowrap;
`

const SecondaryDetails = ({ children }: { children: ReactNode }) => (
  <StyledSecondaryDetails>{children}</StyledSecondaryDetails>
)

const SecondaryInfoContainer = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 20px;
`

const SecondaryInfo = ({ children }: { children: ReactNode }) => {
  return <SecondaryInfoContainer>{children}</SecondaryInfoContainer>
}

const TertiaryInfoContainer = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  margin-top: 8px;
`

const TertiaryInfo = ({ children }: { children: ReactNode }) => {
  return <TertiaryInfoContainer>{children}</TertiaryInfoContainer>
}

interface Erc1155ControlsInterface {
  quantity: string
}

const Erc1155Controls = ({ quantity }: Erc1155ControlsInterface) => {
  const { addAssetToBag, removeAssetFromBag } = useCardContext()

  return (
    <Erc1155ControlsRow>
      <Erc1155ControlsContainer>
        <Erc1155ControlsInput
          onClick={(e: MouseEvent) => {
            e.stopPropagation()
            removeAssetFromBag()
          }}
        >
          <MinusIconLarge width="24px" height="24px" />
        </Erc1155ControlsInput>
        <Erc1155ControlsDisplay>{quantity}</Erc1155ControlsDisplay>
        <Erc1155ControlsInput
          onClick={(e: MouseEvent) => {
            e.stopPropagation()
            addAssetToBag()
          }}
        >
          <PlusIconLarge width="24px" height="24px" />
        </Erc1155ControlsInput>
      </Erc1155ControlsContainer>
    </Erc1155ControlsRow>
  )
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

const DetailsLink = () => {
  const { asset } = useCardContext()

  return (
    <DetailsLinkContainer
      href={baseHref(asset)}
      onClick={(e: MouseEvent) => {
        e.stopPropagation()
      }}
    >
      <div data-testid="nft-details-link">Details</div>
    </DetailsLinkContainer>
  )
}

/* -------- RANKING CARD -------- */
interface RankingProps {
  rarity: Rarity
  provider: { url?: string; rank?: number }
  rarityVerified: boolean
  rarityLogo?: string
}

const RarityLogoContainer = styled(Row)`
  margin-right: 4px;
  width: 16px;
`

const RarityText = styled(ThemedText.BodySmall)`
  display: flex;
`

const RarityInfo = styled(Row)`
  height: 16px;
  border-radius: 4px;
  color: ${({ theme }) => theme.textPrimary};
  background: ${({ theme }) => theme.backgroundInteractive};
  font-size: 10px;
  font-weight: 600;
  padding: 0px 4px;
  line-height: 12px;
  letter-spacing: 0.04em;
  backdrop-filter: blur(6px);
`

const Ranking = ({ rarity, provider, rarityVerified, rarityLogo }: RankingProps) => {
  const { asset } = useCardContext()

  return (
    <>
      {provider.rank && (
        <RankingContainer>
          <MouseoverTooltip
            text={
              <Row>
                <RarityLogoContainer>
                  <img src={rarityLogo} alt="cardLogo" width={16} height={16} />
                </RarityLogoContainer>
                <RarityText>
                  {rarityVerified
                    ? `Verified by ${
                        ('collectionName' in asset && asset.collectionName) ||
                        ('asset_contract' in asset && asset.asset_contract?.name)
                      }`
                    : `Ranking by ${rarity.primaryProvider === 'Genie' ? fallbackProvider : rarity.primaryProvider}`}
                </RarityText>
              </Row>
            }
            placement="top"
          >
            <RarityInfo>
              <Row padding="2px 0px">{putCommas(provider.rank)}</Row>
              <Row>{rarityVerified ? <RarityVerifiedIcon /> : null}</Row>
            </RarityInfo>
          </MouseoverTooltip>
        </RankingContainer>
      )}
    </>
  )
}

const SUSPICIOUS_TEXT = t`Blocked on OpenSea`

const SuspiciousIconContainer = styled(Row)`
  flex-shrink: 0;
  margin-left: 4px;
`

const PoolIconContainer = styled(SuspiciousIconContainer)`
  color: ${({ theme }) => theme.textSecondary};
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

const Pool = () => {
  return (
    <MouseoverTooltip
      text={
        <ThemedText.BodySmall>
          This NFT is part of a liquidity pool. Buying this will increase the price of the remaining pooled NFTs.
        </ThemedText.BodySmall>
      }
      placement="top"
    >
      <PoolIconContainer>
        <PoolIcon width="20" height="20" />
      </PoolIconContainer>
    </MouseoverTooltip>
  )
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
  Audio,
  Container,
  DetailsContainer,
  DetailsLink,
  Erc1155Controls,
  Image,
  ImageContainer,
  InfoContainer,
  MarketplaceIcon,
  Pool,
  PrimaryDetails,
  PrimaryInfo,
  PrimaryRow,
  ProfileNftDetails,
  Ranking,
  SecondaryDetails,
  SecondaryInfo,
  SecondaryRow,
  Suspicious,
  SUSPICIOUS_TEXT,
  TertiaryInfo,
  useAssetMediaType,
  useNotForSale,
  Video,
}
