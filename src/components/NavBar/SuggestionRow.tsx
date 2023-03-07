import { sendAnalyticsEvent } from '@uniswap/analytics'
import { InterfaceEventName } from '@uniswap/analytics-events'
import { formatUSDPrice } from '@uniswap/conedison/format'
import clsx from 'clsx'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import TokenSafetyIcon from 'components/TokenSafety/TokenSafetyIcon'
import { checkSearchTokenWarning } from 'constants/tokenSafety'
import { Chain, TokenStandard } from 'graphql/data/__generated__/types-and-hooks'
import { SearchToken } from 'graphql/data/SearchTokens'
import { getTokenDetailsURL } from 'graphql/data/util'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { VerifiedIcon } from 'nft/components/icons'
import { vars } from 'nft/css/sprinkles.css'
import { GenieCollection } from 'nft/types'
import { ethNumberStandardFormatter } from 'nft/utils/currency'
import { putCommas } from 'nft/utils/putCommas'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { DeltaText, getDeltaArrow } from '../Tokens/TokenDetails/PriceChart'
import { useAddRecentlySearchedAsset } from './RecentlySearchedAssets'
import * as styles from './SearchBar.css'

const PriceChangeContainer = styled.div`
  display: flex;
  align-items: center;
`

const ArrowCell = styled.span`
  padding-top: 5px;
  padding-right: 3px;
`

interface CollectionRowProps {
  collection: GenieCollection
  isHovered: boolean
  setHoveredIndex: (index: number | undefined) => void
  toggleOpen: () => void
  index: number
  eventProperties: Record<string, unknown>
}

export const CollectionRow = ({
  collection,
  isHovered,
  setHoveredIndex,
  toggleOpen,
  index,
  eventProperties,
}: CollectionRowProps) => {
  const [brokenImage, setBrokenImage] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const addRecentlySearchedAsset = useAddRecentlySearchedAsset()
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    addRecentlySearchedAsset({ ...collection, isNft: true, chain: Chain.Ethereum })
    toggleOpen()
    sendAnalyticsEvent(InterfaceEventName.NAVBAR_RESULT_SELECTED, { ...eventProperties })
  }, [addRecentlySearchedAsset, collection, toggleOpen, eventProperties])

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && isHovered) {
        event.preventDefault()
        navigate(`/nfts/collection/${collection.address}`)
        handleClick()
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [toggleOpen, isHovered, collection, navigate, handleClick])

  return (
    <Link
      to={`/nfts/collection/${collection.address}`}
      onClick={handleClick}
      onMouseEnter={() => !isHovered && setHoveredIndex(index)}
      onMouseLeave={() => isHovered && setHoveredIndex(undefined)}
      className={styles.suggestionRow}
      style={{ background: isHovered ? vars.color.lightGrayOverlay : 'none' }}
    >
      <Row style={{ width: '60%' }}>
        {!brokenImage && collection.imageUrl ? (
          <Box
            as="img"
            src={collection.imageUrl}
            alt={collection.name}
            className={clsx(loaded ? styles.suggestionImage : styles.imageHolder)}
            onError={() => setBrokenImage(true)}
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <Box className={styles.imageHolder} />
        )}
        <Column className={styles.suggestionPrimaryContainer}>
          <Row gap="4" width="full">
            <Box className={styles.primaryText}>{collection.name}</Box>
            {collection.isVerified && <VerifiedIcon className={styles.suggestionIcon} />}
          </Row>
          <Box className={styles.secondaryText}>{putCommas(collection?.stats?.total_supply ?? 0)} items</Box>
        </Column>
      </Row>
      {collection.stats?.floor_price ? (
        <Column className={styles.suggestionSecondaryContainer}>
          <Row gap="4">
            <Box className={styles.primaryText}>{ethNumberStandardFormatter(collection.stats?.floor_price)} ETH</Box>
          </Row>
          <Box className={styles.secondaryText}>Floor</Box>
        </Column>
      ) : null}
    </Link>
  )
}

interface TokenRowProps {
  token: SearchToken
  isHovered: boolean
  setHoveredIndex: (index: number | undefined) => void
  toggleOpen: () => void
  index: number
  eventProperties: Record<string, unknown>
}

export const TokenRow = ({ token, isHovered, setHoveredIndex, toggleOpen, index, eventProperties }: TokenRowProps) => {
  const addRecentlySearchedAsset = useAddRecentlySearchedAsset()
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    const address = !token.address && token.standard === TokenStandard.Native ? 'NATIVE' : token.address
    address && addRecentlySearchedAsset({ address, chain: token.chain })

    toggleOpen()
    sendAnalyticsEvent(InterfaceEventName.NAVBAR_RESULT_SELECTED, { ...eventProperties })
  }, [addRecentlySearchedAsset, token, toggleOpen, eventProperties])

  const tokenDetailsPath = getTokenDetailsURL(token)
  // Close the modal on escape
  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && isHovered) {
        event.preventDefault()
        navigate(tokenDetailsPath)
        handleClick()
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [toggleOpen, isHovered, token, navigate, handleClick, tokenDetailsPath])

  const arrow = getDeltaArrow(token.market?.pricePercentChange?.value, 18)

  return (
    <Link
      data-cy={`searchbar-token-row-${token.symbol}`}
      to={tokenDetailsPath}
      onClick={handleClick}
      onMouseEnter={() => !isHovered && setHoveredIndex(index)}
      onMouseLeave={() => isHovered && setHoveredIndex(undefined)}
      className={styles.suggestionRow}
      style={{ background: isHovered ? vars.color.lightGrayOverlay : 'none' }}
    >
      <Row style={{ width: '65%' }}>
        <QueryTokenLogo
          token={token}
          symbol={token.symbol}
          size="36px"
          backupImg={token.project?.logoUrl}
          style={{ paddingRight: '8px' }}
        />
        <Column className={styles.suggestionPrimaryContainer}>
          <Row gap="4" width="full">
            <Box className={styles.primaryText}>{token.name}</Box>
            <TokenSafetyIcon warning={checkSearchTokenWarning(token)} />
          </Row>
          <Box className={styles.secondaryText}>{token.symbol}</Box>
        </Column>
      </Row>

      <Column className={styles.suggestionSecondaryContainer}>
        {!!token.market?.price?.value && (
          <>
            <Row gap="4">
              <Box className={styles.primaryText}>{formatUSDPrice(token.market.price.value)}</Box>
            </Row>
            <PriceChangeContainer>
              <ArrowCell>{arrow}</ArrowCell>
              <ThemedText.BodySmall>
                <DeltaText delta={token.market?.pricePercentChange?.value}>
                  {Math.abs(token.market?.pricePercentChange?.value ?? 0).toFixed(2)}%
                </DeltaText>
              </ThemedText.BodySmall>
            </PriceChangeContainer>
          </>
        )}
      </Column>
    </Link>
  )
}

export const SkeletonRow = () => {
  return (
    <Row className={styles.suggestionRow}>
      <Row width="full">
        <Box className={styles.imageHolder} />
        <Column gap="4" width="full">
          <Row justifyContent="space-between">
            <Box borderRadius="round" height="20" background="backgroundModule" style={{ width: '180px' }} />
            <Box borderRadius="round" height="20" width="48" background="backgroundModule" />
          </Row>

          <Row justifyContent="space-between">
            <Box borderRadius="round" height="16" width="120" background="backgroundModule" />
            <Box borderRadius="round" height="16" width="48" background="backgroundModule" />
          </Row>
        </Column>
      </Row>
    </Row>
  )
}
