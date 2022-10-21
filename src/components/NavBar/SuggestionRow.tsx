import { useWeb3React } from '@web3-react/core'
import clsx from 'clsx'
import { L2NetworkLogo, LogoContainer } from 'components/Tokens/TokenTable/TokenRow'
import { getChainInfo } from 'constants/chainInfo'
import { Chain } from 'graphql/data/__generated__/TopTokens100Query.graphql'
import { SearchedToken } from 'graphql/data/TokenSearch'
import { TopToken } from 'graphql/data/TopTokens'
import { chainIdToBackendName, getTokenDetailsURL } from 'graphql/data/util'
import uriToHttp from 'lib/utils/uriToHttp'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { vars } from 'nft/css/sprinkles.css'
import { useSearchHistory } from 'nft/hooks'
import { GenieCollection } from 'nft/types'
import { ethNumberStandardFormatter } from 'nft/utils/currency'
import { putCommas } from 'nft/utils/putCommas'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDollar } from 'utils/formatNumbers'

import * as styles from './SearchBar.css'

interface CollectionRowProps {
  collection: GenieCollection
  isHovered: boolean
  setHoveredIndex: (index: number | undefined) => void
  toggleOpen: () => void
  traceEvent: () => void
  index: number
}

export const CollectionRow = ({
  collection,
  isHovered,
  setHoveredIndex,
  toggleOpen,
  traceEvent,
  index,
}: CollectionRowProps) => {
  const [brokenImage, setBrokenImage] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const addToSearchHistory = useSearchHistory(
    (state: { addItem: (item: NonNullable<TopToken> | GenieCollection) => void }) => state.addItem
  )
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    addToSearchHistory(collection)
    toggleOpen()
    traceEvent()
  }, [addToSearchHistory, collection, toggleOpen, traceEvent])

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
          </Row>
          <Box className={styles.secondaryText}>{putCommas(collection.stats.total_supply)} items</Box>
        </Column>
      </Row>
      {collection.floorPrice ? (
        <Column className={styles.suggestionSecondaryContainer}>
          <Row gap="4">
            <Box className={styles.primaryText}>{ethNumberStandardFormatter(collection.floorPrice)} ETH</Box>
          </Row>
          <Box className={styles.secondaryText}>Floor</Box>
        </Column>
      ) : null}
    </Link>
  )
}

function useBridgedAddress(token: NonNullable<TopToken>): [string | undefined, Chain | undefined, string | undefined] {
  const { chainId: connectedChainId } = useWeb3React()
  const connectedChain = chainIdToBackendName(connectedChainId)
  const bridgedAddress = connectedChain
    ? token.project?.tokens?.find((t) => t.chain === connectedChain)?.address
    : undefined
  if (bridgedAddress && connectedChain) {
    return [bridgedAddress, connectedChain, getChainInfo(connectedChainId)?.circleLogoUrl]
  }
  return [undefined, undefined, undefined]
}

interface TokenRowProps {
  token: NonNullable<TopToken> | SearchedToken
  isHovered: boolean
  setHoveredIndex: (index: number | undefined) => void
  toggleOpen: () => void
  traceEvent: () => void
  index: number
}

export const TokenRow = ({ token, isHovered, setHoveredIndex, toggleOpen, traceEvent, index }: TokenRowProps) => {
  const [brokenImage, setBrokenImage] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const addToSearchHistory = useSearchHistory(
    (state: { addItem: (item: GenieCollection | NonNullable<TopToken> | SearchedToken) => void }) => state.addItem
  )
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    addToSearchHistory(token)
    toggleOpen()
    traceEvent()
  }, [addToSearchHistory, toggleOpen, token, traceEvent])

  const [bridgedAddress, bridgedChain, L2Icon] = useBridgedAddress(token)
  const tokenDetailsPath = getTokenDetailsURL(bridgedAddress ?? token.address, bridgedChain ?? token.chain)
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

  return (
    <Link
      to={tokenDetailsPath}
      onClick={handleClick}
      onMouseEnter={() => !isHovered && setHoveredIndex(index)}
      onMouseLeave={() => isHovered && setHoveredIndex(undefined)}
      className={styles.suggestionRow}
      style={{ background: isHovered ? vars.color.lightGrayOverlay : 'none' }}
    >
      <Row style={{ width: '65%' }}>
        {!brokenImage && token.project?.logoUrl ? (
          <LogoContainer>
            <Box
              as="img"
              src={
                token.project?.logoUrl.includes('ipfs://')
                  ? uriToHttp(token.project?.logoUrl)[0]
                  : token.project?.logoUrl
              }
              alt={token.name ?? undefined}
              className={clsx(loaded ? styles.suggestionImage : styles.imageHolder)}
              onError={() => setBrokenImage(true)}
              onLoad={() => setLoaded(true)}
            />
            <L2NetworkLogo networkUrl={L2Icon} size="16px" />
          </LogoContainer>
        ) : (
          <Box className={styles.imageHolder} />
        )}
        <Column className={styles.suggestionPrimaryContainer}>
          <Row gap="4" width="full">
            <Box className={styles.primaryText}>{token.name}</Box>
          </Row>
          <Box className={styles.secondaryText}>{token.symbol}</Box>
        </Column>
      </Row>

      <Column className={styles.suggestionSecondaryContainer}>
        {token.market?.price?.value && (
          <Row gap="4">
            <Box className={styles.primaryText}>{formatDollar({ num: token.market.price.value, isPrice: true })}</Box>
          </Row>
        )}
        {token.market?.pricePercentChange?.value && (
          <Box
            className={styles.secondaryText}
            color={token.market.pricePercentChange.value >= 0 ? 'green400' : 'red400'}
          >
            {token.market.pricePercentChange.value.toFixed(2)}%
          </Box>
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
