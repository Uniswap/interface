import clsx from 'clsx'
import Column from 'components/Column'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { MinusIconLarge, PlusIconLarge } from 'nft/components/icons'
import { body, subheadSmall } from 'nft/css/common.css'
import { themeVars, vars } from 'nft/css/sprinkles.css'
import { useIsMobile } from 'nft/hooks'
import { GenieAsset } from 'nft/types'
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

const CardContext = createContext<CardContextProps>({
  asset: {} as GenieAsset,
  hovered: false,
  selected: false,
  href: '',
  setHref: () => undefined,
})

const useCardContext = () => {
  return useContext(CardContext)
}

const baseHref = (asset: GenieAsset) => `/#/nft/asset/${asset.address}/${asset.tokenId}?origin=collection`

/* -------- ASSET CARD -------- */
interface CardProps {
  asset: GenieAsset
  children: ReactNode
}

export const Card = ({ asset, children }: CardProps) => {
  const [hovered, toggleHovered] = useReducer((s) => !s, false)
  const [href, setHref] = useState(baseHref(asset))

  const providerValue = useMemo(
    () => ({
      asset,
      selected: false,
      hovered,
      toggleHovered,
      href,
      setHref,
    }),
    [asset, hovered, href]
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
const CardImage = () => {
  const { hovered, asset } = useCardContext()
  const [noContent, setNoContent] = useState(!asset.smallImageUrl && !asset.imageUrl)
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {!noContent ? (
        <Box display="flex" overflow="hidden">
          <Box
            as={'img'}
            alt={asset.name || asset.tokenId}
            width="full"
            style={{
              aspectRatio: 'auto',
              transition: 'transform 0.4s ease 0s',
              background: loaded
                ? 'none'
                : `linear-gradient(270deg, ${themeVars.colors.medGray} 0%, ${themeVars.colors.lightGray} 100%)`,
            }}
            src={asset.imageUrl || asset.smallImageUrl}
            objectFit={'contain'}
            draggable={false}
            onError={() => setNoContent(true)}
            onLoad={() => {
              setLoaded(true)
            }}
            className={clsx(hovered && styles.cardImageHover)}
          />
        </Box>
      ) : (
        <NoContentContainer />
      )}
    </>
  )
}

Card.Image = CardImage

/* -------- CARD DETAILS CONTAINER -------- */
interface CardDetailsContainerProps {
  children: ReactNode
}

const CardDetailsContainer = ({ children }: CardDetailsContainerProps) => {
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

Card.DetailsContainer = CardDetailsContainer

/* -------- CARD INFO CONTAINER -------- */
const InfoContainer = ({ children }: { children: ReactNode }) => {
  return (
    <Box overflow="hidden" width="full">
      {children}
    </Box>
  )
}

Card.InfoContainer = InfoContainer

/* -------- PRIMARY ROW CONTAINER -------- */
const PrimaryRow = ({ children }: { children: ReactNode }) => <Row justifyContent="space-between">{children}</Row>

Card.PrimaryRow = PrimaryRow

/* -------- PRIMARY DETAILS CONTAINER -------- */
const PrimaryDetails = ({ children }: { children: ReactNode }) => (
  <Row overflow="hidden" whiteSpace="nowrap">
    {children}
  </Row>
)

Card.PrimaryDetails = PrimaryDetails

/* -------- PRIMARY INFO -------- */
const PrimaryInfo = ({ children }: { children: ReactNode }) => {
  return (
    <Box
      overflow="hidden"
      whiteSpace="nowrap"
      textOverflow="ellipsis"
      color="blackBlue"
      fontWeight="medium"
      fontSize="14"
      style={{ lineHeight: '20px' }}
    >
      {children}
    </Box>
  )
}

Card.PrimaryInfo = PrimaryInfo

/* -------- SECONDARY ROW CONTAINER -------- */
const SecondaryRow = ({ children }: { children: ReactNode }) => (
  <Row height="20" justifyContent="space-between" marginTop="6">
    {children}
  </Row>
)

Card.SecondaryRow = SecondaryRow

/* -------- SECONDARY DETAILS CONTAINER -------- */
const SecondaryDetails = ({ children }: { children: ReactNode }) => <Row>{children}</Row>

Card.SecondaryDetails = SecondaryDetails

/* -------- SECONDARY INFO -------- */
const SecondaryInfo = ({ children }: { children: ReactNode }) => {
  return (
    <Box
      color="blackBlue"
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

Card.SecondaryInfo = SecondaryInfo

/* -------- TERTIARY INFO -------- */
const TertiaryInfo = ({ children }: { children: ReactNode }) => {
  return (
    <Box marginTop={'8'} color="darkGray">
      {children}
    </Box>
  )
}

Card.TertiaryInfo = TertiaryInfo

/* -------- CARD BUTTON -------- */
interface ButtonProps {
  children: ReactNode
  selectedChildren: ReactNode
  onClick: (e: MouseEvent) => void
  onSelectedClick: (e: MouseEvent) => void
}

const CardButton = ({ children, selectedChildren, onClick, onSelectedClick }: ButtonProps) => {
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
              ? 'error'
              : asset.notForSale
              ? 'placeholder'
              : 'blue400'
          }
          style={{
            background: `${
              buttonHovered || isMobile
                ? selected
                  ? vars.color.error
                  : vars.color.blue400
                : selected
                ? '#FA2B391F'
                : '#4C82FB1F'
            }`,
          }}
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
          <Box className={`${styles.erc1155QuantityText} ${subheadSmall}`}></Box>
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

Card.Button = CardButton

export default Card

/* -------- MARKETPLACE ICON -------- */
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

Card.MarketplaceIcon = MarketplaceIcon

/* -------- NO CONTENT CARD -------- */
const NoContentContainer = () => (
  <Box
    position="relative"
    width="full"
    style={{
      paddingTop: '100%',
      background: `linear-gradient(270deg, ${themeVars.colors.medGray} 0%, ${themeVars.colors.lightGray} 100%)`,
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
)
