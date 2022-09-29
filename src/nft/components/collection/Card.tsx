import clsx from 'clsx'
import Column from 'components/Column'
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
  SuspiciousIcon20,
} from 'nft/components/icons'
import { body, bodySmall, subheadSmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useIsMobile } from 'nft/hooks'
import { GenieAsset, Rarity, UniformHeight, UniformHeights } from 'nft/types'
import { fallbackProvider, putCommas } from 'nft/utils'
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

import * as styles from './Card.css'

/* -------- ASSET CONTEXT -------- */
export interface CardContextProps {
  asset: GenieAsset
  hovered: boolean
  selected: boolean
  href: string
  setHref: (href: string) => void
}

const CardContext = createContext<CardContextProps | undefined>(undefined)

const useCardContext = () => {
  const context = useContext(CardContext)
  if (!context) throw new Error('Must use context inside of provider')
  return context
}

const baseHref = (asset: GenieAsset) => `/#/nfts/asset/${asset.address}/${asset.tokenId}?origin=collection`

/* -------- ASSET CARD -------- */
interface CardProps {
  asset: GenieAsset
  selected: boolean
  children: ReactNode
}

const Container = ({ asset, selected, children }: CardProps) => {
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
    }),
    [asset, hovered, selected, href]
  )

  const assetRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (hovered && assetRef.current?.matches(':hover') === false) toggleHovered()
  }, [hovered])

  return (
    <CardContext.Provider value={providerValue}>
      <Box
        as="a"
        href={href ? href : baseHref(asset)}
        position={'relative'}
        ref={assetRef}
        borderRadius={'20'}
        className={styles.notSelectedCard}
        draggable={false}
        onMouseEnter={() => toggleHovered()}
        onMouseLeave={() => toggleHovered()}
        transition="250"
      >
        {children}
      </Box>
    </CardContext.Provider>
  )
}

/* -------- CARD IMAGE -------- */
interface ImageProps {
  uniformHeight: UniformHeight
  setUniformHeight: (height: UniformHeight) => void
}

const Image = ({ uniformHeight, setUniformHeight }: ImageProps) => {
  const { hovered, asset } = useCardContext()
  const [noContent, setNoContent] = useState(!asset.smallImageUrl && !asset.imageUrl)
  const [loaded, setLoaded] = useState(false)

  if (noContent) {
    return <NoContentContainer uniformHeight={uniformHeight} />
  }

  return (
    <Box display="flex" overflow="hidden">
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
          if (uniformHeight === UniformHeights.unset) {
            setUniformHeight(e.currentTarget.clientHeight)
          } else if (uniformHeight !== UniformHeights.notUniform && e.currentTarget.clientHeight !== uniformHeight) {
            setUniformHeight(UniformHeights.notUniform)
          }
          setLoaded(true)
        }}
        className={clsx(hovered && styles.cardImageHover, !loaded && styles.loadingBackground)}
      />
    </Box>
  )
}

interface MediaProps {
  uniformHeight: UniformHeight
  setUniformHeight: (u: UniformHeight) => void
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
            if (uniformHeight !== UniformHeights.notUniform) {
              setUniformHeight(UniformHeights.notUniform)
            }

            setImageLoaded(true)
          }}
          visibility={shouldPlay ? 'hidden' : 'visible'}
          className={clsx(hovered && styles.cardImageHover, !imageLoaded && styles.loadingBackground)}
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
    return <NoContentContainer uniformHeight={uniformHeight} />
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
            if (uniformHeight === UniformHeights.unset) {
              setUniformHeight(e.currentTarget.clientHeight)
            } else if (uniformHeight !== UniformHeights.notUniform && e.currentTarget.clientHeight !== uniformHeight) {
              setUniformHeight(UniformHeights.notUniform)
            }
            setImageLoaded(true)
          }}
          className={clsx(hovered && styles.cardImageHover, !imageLoaded && styles.loadingBackground)}
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

const PrimaryRow = ({ children }: { children: ReactNode }) => <Row justifyContent="space-between">{children}</Row>

const PrimaryDetails = ({ children }: { children: ReactNode }) => (
  <Row overflow="hidden" whiteSpace="nowrap">
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

interface ButtonProps {
  children: ReactNode
  quantity: number
  selectedChildren: ReactNode
  onClick: (e: MouseEvent) => void
  onSelectedClick: (e: MouseEvent) => void
}

const Button = ({ children, quantity, selectedChildren, onClick, onSelectedClick }: ButtonProps) => {
  const [buttonHovered, toggleButtonHovered] = useReducer((s) => !s, false)
  const { asset, selected, setHref } = useCardContext()
  const buttonRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  useLayoutEffect(() => {
    if (buttonHovered && buttonRef.current?.matches(':hover') === false) toggleButtonHovered()
  }, [buttonHovered])

  return (
    <>
      {!selected || asset.tokenType !== 'ERC1155' ? (
        <Box
          as="button"
          ref={buttonRef}
          color={
            buttonHovered || isMobile
              ? 'explicitWhite'
              : selected
              ? 'accentFailure'
              : asset.notForSale
              ? 'textTertiary'
              : 'accentAction'
          }
          background={
            buttonHovered || isMobile
              ? asset.notForSale
                ? 'backgroundInteractive'
                : selected
                ? 'accentFailure'
                : 'accentAction'
              : asset.notForSale
              ? 'backgroundModule'
              : selected
              ? 'accentFailureSoft'
              : 'accentActionSoft'
          }
          className={clsx(styles.button, subheadSmall)}
          onClick={(e) =>
            selected
              ? onSelectedClick(e)
              : asset.notForSale
              ? () => {
                  return true
                }
              : onClick(e)
          }
          onMouseEnter={() => {
            !asset.notForSale && setHref('')
            !buttonHovered && toggleButtonHovered()
          }}
          onMouseLeave={() => {
            !asset.notForSale && setHref(baseHref(asset))
            buttonHovered && toggleButtonHovered()
          }}
          transition="250"
        >
          {selected
            ? selectedChildren
            : asset.notForSale
            ? buttonHovered || isMobile
              ? 'See details'
              : 'Not for sale'
            : children}
        </Box>
      ) : (
        <Row className={styles.erc1155ButtonRow}>
          <Column
            as="button"
            className={styles.erc1155MinusButton}
            onClick={(e: MouseEvent<Element, globalThis.MouseEvent>) => onSelectedClick(e)}
          >
            <MinusIconLarge width="32" height="32" />
          </Column>
          <Box className={`${styles.erc1155QuantityText} ${subheadSmall}`}>{quantity.toString()}</Box>
          <Column
            as="button"
            className={styles.erc1155PlusButton}
            onClick={(e: MouseEvent<Element, globalThis.MouseEvent>) => onClick(e)}
          >
            <PlusIconLarge width="32" height="32" />
          </Column>
        </Row>
      )}
    </>
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

/* -------- RANKING CARD -------- */
interface RankingProps {
  rarity: Rarity
  provider: { url?: string; rank: number }
  rarityVerified: boolean
  rarityLogo?: string
}

const Ranking = ({ rarity, provider, rarityVerified, rarityLogo }: RankingProps) => {
  const { asset } = useCardContext()

  return (
    <MouseoverTooltip
      text={
        <Row>
          <Box display="flex" marginRight="4">
            <img src={rarityLogo} alt="cardLogo" width={16} />
          </Box>
          <Box width="full" className={bodySmall}>
            {rarityVerified
              ? `Verified by ${asset.collectionName}`
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
  )
}

const Suspicious = () => {
  return (
    <MouseoverTooltip
      text={
        <Box className={bodySmall}>
          Reported for suspicious activity
          <br />
          on Opensea
        </Box>
      }
      placement="top"
    >
      <Box display="flex" flexShrink="0" marginLeft="2">
        <SuspiciousIcon20 width="20" height="20" />
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
        color="grey500"
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
          background: `linear-gradient(270deg, ${themeVars.colors.backgroundOutline} 0%, ${themeVars.colors.backgroundSurface} 100%)`,
        }}
      >
        <Box
          position="absolute"
          textAlign="center"
          left="1/2"
          top="1/2"
          style={{ transform: 'translate3d(-50%, -50%, 0)' }}
          fontWeight="normal"
          color="grey500"
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
  Button,
  Container,
  DetailsContainer,
  Image,
  InfoContainer,
  MarketplaceIcon,
  Pool,
  PrimaryDetails,
  PrimaryInfo,
  PrimaryRow,
  Ranking,
  SecondaryDetails,
  SecondaryInfo,
  SecondaryRow,
  Suspicious,
  TertiaryInfo,
  Video,
}
