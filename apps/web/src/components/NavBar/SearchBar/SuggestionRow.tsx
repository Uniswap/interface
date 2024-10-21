import { InterfaceEventName } from '@uniswap/analytics-events'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import TokenSafetyIcon from 'components/TokenSafety/TokenSafetyIcon'
import { DeltaArrow, DeltaText } from 'components/Tokens/TokenDetails/Delta'
import { LoadingBubble } from 'components/Tokens/loading'
import Column from 'components/deprecated/Column'
import { useTokenWarning } from 'constants/deprecatedTokenSafety'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { GqlSearchToken } from 'graphql/data/SearchTokens'
import { getPoolDetailsURL, getTokenDetailsURL, supportedChainIdFromGQLChain } from 'graphql/data/util'
import styled, { css } from 'lib/styled-components'
import { searchGenieCollectionToTokenSearchResult, searchTokenToTokenSearchResult } from 'lib/utils/searchBar'
import { GenieCollection } from 'nft/types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { Flex } from 'ui/src'
import { Verified } from 'ui/src/components/icons/Verified'
import { TokenStandard } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { addToSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { InterfaceSearchResultSelectionProperties } from 'uniswap/src/features/telemetry/types'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { shortenAddress } from 'uniswap/src/utils/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const PriceChangeContainer = styled.div`
  display: flex;
  align-items: center;
  padding-top: 4px;
  gap: 2px;
`
const SuggestionRowStyles = css<{ $isFocused: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;
  padding: 8px 16px;
  transition: background ${({ theme }) => theme.transition.duration.medium}
    ${({ theme }) => theme.transition.timing.ease};
  :hover {
    background: ${({ theme }) => theme.surface3};
  }
  ${({ $isFocused, theme }) =>
    $isFocused &&
    `
  background: ${theme.surface2};
`}
`

const StyledLink = styled(Link)`
  ${SuggestionRowStyles}
`
const SkeletonSuggestionRow = styled.div`
  ${SuggestionRowStyles}
`
const CollectionImageStyles = css`
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: ${({ theme }) => theme.surface3};
  flex-shrink: 0;
`
const CollectionImage = styled.img`
  ${CollectionImageStyles}
`
const BrokenCollectionImage = styled.div`
  ${CollectionImageStyles}
`
const PrimaryText = styled(ThemedText.SubHeader)`
  ${EllipsisStyle}
`
const SecondaryContainer = styled(Column)`
  text-align: right;
  align-items: flex-end;
`

interface SuggestionRowProps {
  suggestion: GenieCollection | GqlSearchToken
  isHovered: boolean
  setHoveredIndex: (index: number | undefined) => void
  toggleOpen: () => void
  index: number
  eventProperties: InterfaceSearchResultSelectionProperties
}

function suggestionIsToken(suggestion: GenieCollection | GqlSearchToken): suggestion is GqlSearchToken {
  return (suggestion as GqlSearchToken).decimals !== undefined
}

// Rigoblock pools do not generate volume
function suggestionIsSmartPool(suggestion: GenieCollection | SearchToken): suggestion is SearchToken {
  return (suggestion as SearchToken).market?.volume24H?.value === 0
}
export function SuggestionRow({
  suggestion,
  isHovered,
  setHoveredIndex,
  toggleOpen,
  index,
  eventProperties,
}: SuggestionRowProps) {
  const { t } = useTranslation()
  const isToken = suggestionIsToken(suggestion)
  const isPool = suggestionIsSmartPool(suggestion)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { formatFiatPrice, formatDelta, formatNumberOrString } = useFormatter()
  const [brokenCollectionImage, setBrokenCollectionImage] = useState(false)
  const warning = useTokenWarning(
    isPool ? undefined : isToken ? suggestion.address : undefined,
    isToken ? supportedChainIdFromGQLChain(suggestion.chain) : UniverseChainId.Mainnet,
  )

  const handleClick = useCallback(() => {
    const address =
      !suggestion.address && suggestion.standard === TokenStandard.Native ? NATIVE_CHAIN_ID : suggestion.address

    if (isToken && address) {
      const chainId = supportedChainIdFromGQLChain(suggestion.chain)
      if (chainId) {
        const searchResult = searchTokenToTokenSearchResult({ ...suggestion, address, chainId })
        dispatch(addToSearchHistory({ searchResult }))
      }
    } else {
      const searchResult = searchGenieCollectionToTokenSearchResult(suggestion as GenieCollection)
      dispatch(addToSearchHistory({ searchResult }))
    }

    toggleOpen()
    sendAnalyticsEvent(InterfaceEventName.NAVBAR_RESULT_SELECTED, { ...eventProperties })
  }, [suggestion, isToken, toggleOpen, eventProperties, dispatch])

  const path = isPool
    ? getPoolDetailsURL(
      suggestion.address ?? '',
    ) : isToken
    ? getTokenDetailsURL({ ...suggestion })
    : `/nfts/collection/${suggestion.address}`
  // Close the modal on escape
  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && isHovered) {
        event.preventDefault()
        navigate(path)
        handleClick()
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [toggleOpen, isHovered, suggestion, navigate, handleClick, path])

  const shortenedAddress = useMemo<string | null>(() => {
    if (isToken && suggestion.address && suggestion.address !== NATIVE_CHAIN_ID) {
      return shortenAddress(suggestion.address)
    }

    return null
  }, [suggestion, isToken])

  return (
    <StyledLink
      to={path}
      onClick={handleClick}
      $isFocused={isHovered}
      onMouseEnter={() => !isHovered && setHoveredIndex(index)}
      onMouseLeave={() => isHovered && setHoveredIndex(undefined)}
      data-testid={isToken ? `searchbar-token-row-${suggestion.chain}-${suggestion.address ?? NATIVE_CHAIN_ID}` : ''}
    >
      <Flex row gap="$spacing8" shrink grow overflow="hidden">
        {isToken ? (
          <QueryTokenLogo
            token={suggestion}
            symbol={suggestion.symbol}
            size={36}
            primaryImg={suggestion.project?.logoUrl}
          />
        ) : brokenCollectionImage ? (
          <BrokenCollectionImage />
        ) : (
          <CollectionImage
            src={suggestion.imageUrl}
            alt={suggestion.name}
            onError={() => setBrokenCollectionImage(true)}
          />
        )}
        <Flex alignItems="flex-start" justifyContent="flex-start" shrink grow>
          <Flex row gap="$spacing4" shrink width="95%">
            <PrimaryText lineHeight="24px">{suggestion.name}</PrimaryText>
            {isToken ? <TokenSafetyIcon warning={warning} /> : suggestion.isVerified && <Verified size={14} />}
          </Flex>
          <Flex row gap="$spacing4">
            <ThemedText.SubHeaderSmall lineHeight="20px">
              {isToken
                ? suggestion.symbol
                : t('search.results.count', {
                    count: suggestion?.stats?.total_supply ?? 0,
                  })}
            </ThemedText.SubHeaderSmall>
            {shortenedAddress && (
              <ThemedText.SubHeaderSmall lineHeight="20px" color="neutral3">
                {shortenedAddress}
              </ThemedText.SubHeaderSmall>
            )}
          </Flex>
        </Flex>
      </Flex>

      <SecondaryContainer>
        <Flex row gap="$spacing4">
          <PrimaryText width="100%">
            {isToken
              ? formatFiatPrice({ price: suggestion.market?.price?.value })
              : `${formatNumberOrString({ input: suggestion.stats?.floor_price, type: NumberType.NFTToken })} ETH`}
          </PrimaryText>
        </Flex>

        <PriceChangeContainer>
          {isToken ? (
            <>
              <DeltaArrow delta={suggestion.market?.pricePercentChange?.value} />
              <ThemedText.BodySmall>
                <DeltaText delta={suggestion.market?.pricePercentChange?.value}>
                  {formatDelta(Math.abs(suggestion.market?.pricePercentChange?.value ?? 0))}
                </DeltaText>
              </ThemedText.BodySmall>
            </>
          ) : (
            <ThemedText.BodySmall color="neutral2">
              <Trans i18nKey="common.floor" />
            </ThemedText.BodySmall>
          )}
        </PriceChangeContainer>
      </SecondaryContainer>
    </StyledLink>
  )
}

const SkeletonContent = styled(Column)`
  width: 100%;
`

export function SkeletonRow() {
  return (
    <SkeletonSuggestionRow $isFocused={false}>
      <Flex row width="100%" gap="$gap4">
        <BrokenCollectionImage />
        <SkeletonContent gap="sm">
          <Flex row justifyContent="space-between">
            <LoadingBubble height="20px" width="180px" />
            <LoadingBubble height="20px" width="48px" />
          </Flex>

          <Flex row justifyContent="space-between">
            <LoadingBubble height="16px" width="120px" />
            <LoadingBubble height="16px" width="48px" />
          </Flex>
        </SkeletonContent>
      </Flex>
    </SkeletonSuggestionRow>
  )
}
