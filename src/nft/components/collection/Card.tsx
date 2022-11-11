import { BigNumber } from '@ethersproject/bignumber'
import clsx from 'clsx'
import { MouseoverTooltip } from 'components/Tooltip'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import {
  MinusIconLarge,
  PauseButtonIcon,
  PlayButtonIcon,
  PlusIconLarge,
  PoolIcon,
  RarityVerifiedIcon,
  VerifiedIcon,
} from 'nft/components/icons'
import { body, bodySmall, buttonTextSmall, subhead, subheadSmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useIsMobile } from 'nft/hooks'
import { GenieAsset, Rarity, UniformHeight, UniformHeights, WalletAsset } from 'nft/types'
import { isAudio, isVideo } from 'nft/utils'
import { fallbackProvider, putCommas } from 'nft/utils'
import { floorFormatter } from 'nft/utils/numbers'
import {
  createContext,
  MouseEvent,
  ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { colors } from 'theme/colors'

import * as styles from './Card.css'

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

const baseHref = (asset: GenieAsset | WalletAsset) =>
  'address' in asset ? `/#/nfts/asset/${asset.address}/${asset.tokenId}?origin=collection` : '/nfts/profile'

const DetailsLinkContainer = styled.a`
  display: flex;
  flex-shrink: 0;
  text-decoration: none;
  color: ${({ theme }) => theme.textSecondary};

  :hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  :focus {
    opacity: ${({ theme }) => theme.opacity.click};
  }
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

const StyledImageContainer = styled.div`
  position: relative;
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

  return (
    <CardContext.Provider value={providerValue}>
      <Box
        position={'relative'}
        ref={assetRef}
        borderRadius={BORDER_RADIUS}
        borderBottomLeftRadius={BORDER_RADIUS}
        borderBottomRightRadius={BORDER_RADIUS}
        className={selected ? styles.selectedCard : styles.notSelectedCard}
        draggable={false}
        onMouseEnter={() => toggleHovered()}
        onMouseLeave={() => toggleHovered()}
        transition="250"
        opacity={isDisabled ? '0.5' : '1'}
        cursor={isDisabled ? 'default' : 'pointer'}
        onClick={isDisabled ? () => null : onClick ?? handleAssetInBag}
      >
        {children}
      </Box>
    </CardContext.Provider>
  )
}

const ImageContainer = ({ children }: { children: ReactNode }) => (
  <StyledImageContainer>{children}</StyledImageContainer>
)

/* -------- CARD IMAGE -------- */
interface ImageProps {
  uniformHeight?: UniformHeight
  setUniformHeight?: (height: UniformHeight) => void
}

const Image = ({ uniformHeight, setUniformHeight }: ImageProps) => {
  const { hovered, asset } = useCardContext()
  const [noContent, setNoContent] = useState(!asset.smallImageUrl && !asset.imageUrl)
  const [loaded, setLoaded] = useState(false)
  const isMobile = useIsMobile()

  if (noContent) {
    return <NoContentContainer uniformHeight={uniformHeight ?? UniformHeights.unset} />
  }

  return (
    <Box display="flex" overflow="hidden" borderTopLeftRadius={BORDER_RADIUS} borderTopRightRadius={BORDER_RADIUS}>
      <Box
        as={'img'}
        width="full"
        style={{
          aspectRatio: uniformHeight === UniformHeights.notUniform ? '1' : 'auto',
          transition: 'transform 0.4s ease 0s',
        }}
        src={asset.imageUrl || asset.smallImageUrl}
        objectFit={'contain'}
        draggable={false}
        onError={() => setNoContent(true)}
        onLoad={(e) => {
          if (setUniformHeight) {
            if (uniformHeight === UniformHeights.unset) {
              setUniformHeight(e.currentTarget.clientHeight)
            } else if (uniformHeight !== UniformHeights.notUniform && e.currentTarget.clientHeight !== uniformHeight) {
              setUniformHeight(UniformHeights.notUniform)
            }
          }
          setLoaded(true)
        }}
        className={clsx(hovered && !isMobile && styles.cardImageHover, !loaded && styles.loadingBackground)}
      />
    </Box>
  )
}

interface MediaProps {
  uniformHeight?: UniformHeight
  setUniformHeight?: (u: UniformHeight) => void
  shouldPlay: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
}

const Video = ({ uniformHeight, setUniformHeight, shouldPlay, setCurrentTokenPlayingMedia }: MediaProps) => {
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
    return <NoContentContainer uniformHeight={UniformHeights.notUniform} />
  }

  return (
    <>
      <Box display="flex" overflow="hidden">
        <Box
          as={'img'}
          alt={asset.name || asset.tokenId}
          width="full"
          style={{
            aspectRatio: '1',
            transition: 'transform 0.4s ease 0s',
            willChange: 'transform',
          }}
          src={asset.imageUrl || asset.smallImageUrl}
          objectFit={'contain'}
          draggable={false}
          onError={() => setNoContent(true)}
          onLoad={() => {
            if (setUniformHeight && uniformHeight !== UniformHeights.notUniform) {
              setUniformHeight(UniformHeights.notUniform)
            }

            setImageLoaded(true)
          }}
          visibility={shouldPlay ? 'hidden' : 'visible'}
          className={clsx(hovered && !isMobile && styles.cardImageHover, !imageLoaded && styles.loadingBackground)}
        />
      </Box>
      {shouldPlay ? (
        <>
          <Box className={styles.playbackSwitch}>
            <PauseButtonIcon
              width="100%"
              height="100%"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentTokenPlayingMedia(undefined)
              }}
              className="playback-icon"
            />
          </Box>
          <Box position="absolute" left="0" top="0" display="flex">
            <Box
              as="video"
              ref={vidRef}
              width="full"
              style={{
                aspectRatio: '1',
              }}
              onEnded={(e) => {
                e.preventDefault()
                setCurrentTokenPlayingMedia(undefined)
              }}
              loop
              playsInline
            >
              <source src={asset.animationUrl} />
            </Box>
          </Box>
        </>
      ) : (
        <Box className={styles.playbackSwitch}>
          {((!isMobile && hovered) || isMobile) && (
            <PlayButtonIcon
              width="100%"
              height="100%"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentTokenPlayingMedia(asset.tokenId)
              }}
              className="playback-icon"
            />
          )}
        </Box>
      )}
    </>
  )
}

const Audio = ({ uniformHeight, setUniformHeight, shouldPlay, setCurrentTokenPlayingMedia }: MediaProps) => {
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
    return <NoContentContainer uniformHeight={uniformHeight ?? UniformHeights.unset} />
  }

  return (
    <>
      <Box display="flex" overflow="hidden">
        <Box
          as={'img'}
          alt={asset.name || asset.tokenId}
          width="full"
          style={{
            aspectRatio: uniformHeight === UniformHeights.notUniform ? '1' : 'auto',
            transition: 'transform 0.4s ease 0s',
          }}
          src={asset.imageUrl || asset.smallImageUrl}
          objectFit={'contain'}
          draggable={false}
          onError={() => setNoContent(true)}
          onLoad={(e) => {
            if (setUniformHeight) {
              if (uniformHeight === UniformHeights.unset) {
                setUniformHeight(e.currentTarget.clientHeight)
              } else if (
                uniformHeight !== UniformHeights.notUniform &&
                e.currentTarget.clientHeight !== uniformHeight
              ) {
                setUniformHeight(UniformHeights.notUniform)
              }
            }
            setImageLoaded(true)
          }}
          className={clsx(hovered && !isMobile && styles.cardImageHover, !imageLoaded && styles.loadingBackground)}
        />
      </Box>
      {shouldPlay ? (
        <>
          <Box className={styles.playbackSwitch}>
            <PauseButtonIcon
              width="100%"
              height="100%"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentTokenPlayingMedia(undefined)
              }}
              className="playback-icon"
            />
          </Box>
          <Box position="absolute" left="0" top="0" display="flex">
            <Box
              as="audio"
              ref={audRef}
              width="full"
              height="full"
              onEnded={(e) => {
                e.preventDefault()
                setCurrentTokenPlayingMedia(undefined)
              }}
            >
              <source src={asset.animationUrl} />
            </Box>
          </Box>
        </>
      ) : (
        <Box className={styles.playbackSwitch}>
          {((!isMobile && hovered) || isMobile) && (
            <PlayButtonIcon
              width="100%"
              height="100%"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentTokenPlayingMedia(asset.tokenId)
              }}
              className="playback-icon"
            />
          )}
        </Box>
      )}
    </>
  )
}

/* -------- CARD DETAILS CONTAINER -------- */
interface CardDetailsContainerProps {
  children: ReactNode
}

const DetailsContainer = ({ children }: CardDetailsContainerProps) => {
  return (
    <Row
      position="relative"
      paddingX="12"
      paddingTop="12"
      justifyContent="space-between"
      flexDirection="column"
      transition="250"
    >
      {children}
    </Row>
  )
}

const InfoContainer = ({ children }: { children: ReactNode }) => {
  return (
    <Box overflow="hidden" width="full">
      {children}
    </Box>
  )
}

const TruncatedTextRow = styled(Row)`
  padding: 2px;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: block;
  overflow: hidden;
`

interface ProfileNftDetailsProps {
  asset: WalletAsset
  isSellMode: boolean
}

const ProfileNftDetails = ({ asset, isSellMode }: ProfileNftDetailsProps) => {
  const assetName = () => {
    if (!asset.name && !asset.tokenId) return
    return !!asset.name ? asset.name : `#${asset.tokenId}`
  }

  return (
    <Box overflow="hidden" width="full" flexWrap="nowrap">
      <Row justifyItems="flex-start">
        <TruncatedTextRow className={bodySmall} style={{ color: themeVars.colors.textSecondary }}>
          {!!asset.asset_contract.name && <span>{asset.asset_contract.name}</span>}
        </TruncatedTextRow>
        {asset.collectionIsVerified && <VerifiedIcon height="16px" width="16px" fill={colors.magentaVibrant} />}
      </Row>
      <Row justifyItems="flex-start">
        <TruncatedTextRow
          className={subheadSmall}
          style={{
            color: themeVars.colors.textPrimary,
          }}
        >
          {assetName()}
        </TruncatedTextRow>
        {asset.susFlag && <Suspicious />}
      </Row>
      <TruncatedTextRow
        className={subhead}
        style={{ color: !asset.notForSale ? themeVars.colors.textPrimary : themeVars.colors.textSecondary }}
      >
        {!asset.notForSale && <span>{`${floorFormatter(asset.floor_sell_order_price)} ETH`}</span>}
        {asset.notForSale && isSellMode && !!asset.floorPrice && (
          <span>{`${floorFormatter(asset.floorPrice)} ETH Floor`}</span>
        )}
      </TruncatedTextRow>
    </Box>
  )
}

const PrimaryRow = ({ children }: { children: ReactNode }) => (
  <Row gap="8" justifyContent="space-between">
    {children}
  </Row>
)

const PrimaryDetails = ({ children }: { children: ReactNode }) => (
  <Row justifyItems="center" overflow="hidden" whiteSpace="nowrap">
    {children}
  </Row>
)

const PrimaryInfo = ({ children }: { children: ReactNode }) => {
  return (
    <Box
      overflow="hidden"
      whiteSpace="nowrap"
      textOverflow="ellipsis"
      color="textPrimary"
      fontWeight="medium"
      fontSize="14"
      style={{ lineHeight: '20px' }}
    >
      {children}
    </Box>
  )
}

const SecondaryRow = ({ children }: { children: ReactNode }) => (
  <Row height="20" justifyContent="space-between" marginTop="6">
    {children}
  </Row>
)

const SecondaryDetails = ({ children }: { children: ReactNode }) => (
  <Row overflow="hidden" whiteSpace="nowrap">
    {children}
  </Row>
)

const SecondaryInfo = ({ children }: { children: ReactNode }) => {
  return (
    <Box
      color="textPrimary"
      overflow="hidden"
      whiteSpace="nowrap"
      textOverflow="ellipsis"
      fontSize="16"
      fontWeight="medium"
      style={{ lineHeight: '20px' }}
    >
      {children}
    </Box>
  )
}

const TertiaryInfo = ({ children }: { children: ReactNode }) => {
  return (
    <Box marginTop={'8'} color="textSecondary">
      {children}
    </Box>
  )
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

const MarketplaceIcon = ({ marketplace }: { marketplace: string }) => {
  return (
    <Box
      as="img"
      alt={marketplace}
      src={`/nft/svgs/marketplaces/${marketplace}.svg`}
      className={styles.marketplaceIcon}
    />
  )
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
      <Box className={buttonTextSmall}>Details</Box>
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

const Ranking = ({ rarity, provider, rarityVerified, rarityLogo }: RankingProps) => {
  const { asset } = useCardContext()

  return (
    <>
      {provider.rank && (
        <RankingContainer>
          <MouseoverTooltip
            text={
              <Row>
                <Box display="flex" marginRight="4">
                  <img src={rarityLogo} alt="cardLogo" width={16} />
                </Box>
                <Box width="full" className={bodySmall}>
                  {rarityVerified
                    ? `Verified by ${
                        ('collectionName' in asset && asset.collectionName) ||
                        ('asset_contract' in asset && asset.asset_contract?.name)
                      }`
                    : `Ranking by ${rarity.primaryProvider === 'Genie' ? fallbackProvider : rarity.primaryProvider}`}
                </Box>
              </Row>
            }
            placement="top"
          >
            <Box className={styles.rarityInfo}>
              <Box paddingTop="2" paddingBottom="2" display="flex">
                {putCommas(provider.rank)}
              </Box>

              <Box display="flex" height="16">
                {rarityVerified ? <RarityVerifiedIcon /> : null}
              </Box>
            </Box>
          </MouseoverTooltip>
        </RankingContainer>
      )}
    </>
  )
}
const SUSPICIOUS_TEXT = 'Blocked on OpenSea'

const Suspicious = () => {
  return (
    <MouseoverTooltip text={<Box className={bodySmall}>{SUSPICIOUS_TEXT}</Box>} placement="top">
      <Box display="flex" flexShrink="0" marginLeft="4">
        <SuspiciousIcon />
      </Box>
    </MouseoverTooltip>
  )
}

const Pool = () => {
  return (
    <MouseoverTooltip
      text={
        <Box className={bodySmall}>
          This NFT is part of a liquidity pool. Buying this will increase the price of the remaining pooled NFTs.
        </Box>
      }
      placement="top"
    >
      <Box display="flex" flexShrink="0" marginLeft="4" color="textSecondary">
        <PoolIcon width="20" height="20" />
      </Box>
    </MouseoverTooltip>
  )
}

interface NoContentContainerProps {
  uniformHeight: UniformHeight
}

const NoContentContainer = ({ uniformHeight }: NoContentContainerProps) => (
  <>
    {uniformHeight !== UniformHeights.unset && uniformHeight !== UniformHeights.notUniform ? (
      <Box
        display="flex"
        width="full"
        style={{
          height: `${uniformHeight as number}px`,
          background: `linear-gradient(270deg, ${themeVars.colors.backgroundOutline} 0%, ${themeVars.colors.backgroundSurface} 100%)`,
        }}
        fontWeight="normal"
        color="gray500"
        className={body}
        justifyContent="center"
        alignItems="center"
        textAlign="center"
      >
        Content not
        <br />
        available yet
      </Box>
    ) : (
      <Box
        position="relative"
        width="full"
        style={{
          paddingTop: '100%',
          background: `linear-gradient(90deg, ${themeVars.colors.backgroundSurface} 0%, ${themeVars.colors.backgroundInteractive} 95.83%)`,
        }}
      >
        <Box
          position="absolute"
          textAlign="center"
          left="1/2"
          top="1/2"
          style={{ transform: 'translate3d(-50%, -50%, 0)' }}
          fontWeight="normal"
          color="gray500"
          className={body}
        >
          Content not
          <br />
          available yet
        </Box>
      </Box>
    )}
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
