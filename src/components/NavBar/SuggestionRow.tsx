import { sendAnalyticsEvent } from '@uniswap/analytics'
import { EventName } from '@uniswap/analytics-events'
import { formatUSDPrice } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import clsx from 'clsx'
import AssetLogo from 'components/Logo/AssetLogo'
import { L2NetworkLogo, LogoContainer } from 'components/Tokens/TokenTable/TokenRow'
import TokenSafetyIcon from 'components/TokenSafety/TokenSafetyIcon'
import { getChainInfo } from 'constants/chainInfo'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { getTokenDetailsURL } from 'graphql/data/util'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { VerifiedIcon } from 'nft/components/icons'
import { vars } from 'nft/css/sprinkles.css'
import { useSearchHistory } from 'nft/hooks'
import { FungibleToken, GenieCollection } from 'nft/types'
import { ethNumberStandardFormatter } from 'nft/utils/currency'
import { putCommas } from 'nft/utils/putCommas'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'

import { getDeltaArrow } from '../Tokens/TokenDetails/PriceChart'
import * as styles from './SearchBar.css'

const StyledLogoContainer = styled(LogoContainer)`
  margin-right: 8px;
`
const PriceChangeContainer = styled.div`
  display: flex;
  align-items: center;
`

const PriceChangeText = styled.span<{ isNegative: boolean }>`
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme, isNegative }) => (isNegative ? theme.accentFailure : theme.accentSuccess)};
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
  const addToSearchHistory = useSearchHistory(
    (state: { addItem: (item: FungibleToken | GenieCollection) => void }) => state.addItem
  )
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    addToSearchHistory(collection)
    toggleOpen()
    sendAnalyticsEvent(EventName.NAVBAR_RESULT_SELECTED, { ...eventProperties })
  }, [addToSearchHistory, collection, toggleOpen, eventProperties])

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

function useBridgedAddress(token: FungibleToken): [string | undefined, number | undefined, string | undefined] {
  const { chainId: connectedChainId } = useWeb3React()
  const bridgedAddress = connectedChainId ? token.extensions?.bridgeInfo?.[connectedChainId]?.tokenAddress : undefined
  if (bridgedAddress && connectedChainId) {
    return [bridgedAddress, connectedChainId, getChainInfo(connectedChainId)?.circleLogoUrl]
  }
  return [undefined, undefined, undefined]
}

interface TokenRowProps {
  token: FungibleToken
  isHovered: boolean
  setHoveredIndex: (index: number | undefined) => void
  toggleOpen: () => void
  index: number
  eventProperties: Record<string, unknown>
}

export const TokenRow = ({ token, isHovered, setHoveredIndex, toggleOpen, index, eventProperties }: TokenRowProps) => {
  const addToSearchHistory = useSearchHistory(
    (state: { addItem: (item: FungibleToken | GenieCollection) => void }) => state.addItem
  )
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    addToSearchHistory(token)
    toggleOpen()
    sendAnalyticsEvent(EventName.NAVBAR_RESULT_SELECTED, { ...eventProperties })
  }, [addToSearchHistory, toggleOpen, token, eventProperties])

  const [bridgedAddress, bridgedChain, L2Icon] = useBridgedAddress(token)
  const tokenDetailsPath = getTokenDetailsURL(bridgedAddress ?? token.address, undefined, bridgedChain ?? token.chainId)
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

  const arrow = getDeltaArrow(token.price24hChange, 18)

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
        <StyledLogoContainer>
          <AssetLogo
            isNative={token.address === NATIVE_CHAIN_ID}
            address={token.address}
            chainId={token.chainId}
            symbol={token.symbol}
            size="36px"
            backupImg={token.logoURI}
          />
          <L2NetworkLogo networkUrl={L2Icon} size="16px" />
        </StyledLogoContainer>
        <Column className={styles.suggestionPrimaryContainer}>
          <Row gap="4" width="full">
            <Box className={styles.primaryText}>{token.name}</Box>
            <TokenSafetyIcon warning={checkWarning(token.address)} />
          </Row>
          <Box className={styles.secondaryText}>{token.symbol}</Box>
        </Column>
      </Row>

      <Column className={styles.suggestionSecondaryContainer}>
        {token.priceUsd && (
          <Row gap="4">
            <Box className={styles.primaryText}>{formatUSDPrice(token.priceUsd)}</Box>
          </Row>
        )}
        {token.price24hChange && (
          <PriceChangeContainer>
            <ArrowCell>{arrow}</ArrowCell>
            <PriceChangeText isNegative={token.price24hChange < 0}>
              {Math.abs(token.price24hChange).toFixed(2)}%
            </PriceChangeText>
          </PriceChangeContainer>
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
