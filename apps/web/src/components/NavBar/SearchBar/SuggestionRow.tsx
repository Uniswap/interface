import { InterfaceEventName } from '@uniswap/analytics-events'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import { DeltaArrow, DeltaText } from 'components/Tokens/TokenDetails/Delta'
import { LoadingBubble } from 'components/Tokens/loading'
import Column from 'components/deprecated/Column'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { GqlSearchToken } from 'graphql/data/SearchTokens'
import { gqlTokenToCurrencyInfo } from 'graphql/data/types'
import { getTokenDetailsURL } from 'graphql/data/util'
import styled, { css } from 'lib/styled-components'
import { searchTokenToTokenSearchResult } from 'lib/utils/searchBar'
import { GenieCollection } from 'nft/types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { EllipsisStyle } from 'theme/components/styles'
import { Flex } from 'ui/src'
import { Verified } from 'ui/src/components/icons/Verified'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { getWarningIconColors } from 'uniswap/src/components/warnings/utils'
import { Token, TokenStandard } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { addToSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { InterfaceSearchResultSelectionProperties } from 'uniswap/src/features/telemetry/types'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/safetyUtils'
import { shortenAddress } from 'utilities/src/addresses'
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

export function suggestionIsToken(suggestion: GenieCollection | GqlSearchToken): suggestion is GqlSearchToken {
  return (suggestion as GqlSearchToken).decimals !== undefined
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
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { formatFiatPrice, formatDelta, formatNumberOrString } = useFormatter()
  const [brokenCollectionImage, setBrokenCollectionImage] = useState(false)

  const tokenWarningSeverity = isToken
    ? getTokenWarningSeverity(gqlTokenToCurrencyInfo(suggestion as Token)) // casting GqlSearchToken to Token
    : undefined
  // in search, we only show the warning icon if token is >=Medium severity
  const { colorSecondary: warningIconColor } = getWarningIconColors(tokenWarningSeverity)

  const handleClick = useCallback(() => {
    const address =
      !suggestion.address && suggestion.standard === TokenStandard.Native ? NATIVE_CHAIN_ID : suggestion.address

    if (isToken && address) {
      const chainId = fromGraphQLChain(suggestion.chain)
      if (chainId) {
        const searchResult = searchTokenToTokenSearchResult({ ...suggestion, address, chainId })
        dispatch(addToSearchHistory({ searchResult }))
      }
    }

    toggleOpen()
    sendAnalyticsEvent(InterfaceEventName.NAVBAR_RESULT_SELECTED, { ...eventProperties })
  }, [suggestion, isToken, toggleOpen, eventProperties, dispatch])

  const path = isToken ? getTokenDetailsURL({ ...suggestion }) : `/nfts/collection/${suggestion.address}`
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
          <Flex row gap="$spacing4" shrink width="95%" {...(isToken && { alignItems: 'center' })}>
            <PrimaryText lineHeight="24px">{suggestion.name}</PrimaryText>
            {isToken
              ? warningIconColor && (
                  <WarningIcon
                    severity={tokenWarningSeverity}
                    size="$icon.16"
                    flexShrink={0}
                    flexGrow={0}
                    strokeColorOverride={warningIconColor}
                  />
                )
              : suggestion.isVerified && <Verified size={14} />}
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
      <Flex row width="100%" gap="$gap4" alignItems="center">
        <BrokenCollectionImage />
        <SkeletonContent gap="sm">
          <Flex row justifyContent="space-between">
            <LoadingBubble height="20px" width="180px" containerWidth="180px" />
            <LoadingBubble height="20px" width="48px" containerWidth="48px" />
          </Flex>

          <Flex row justifyContent="space-between">
            <LoadingBubble height="16px" width="120px" containerWidth="120px" />
            <LoadingBubble height="16px" width="48px" containerWidth="48px" />
          </Flex>
        </SkeletonContent>
      </Flex>
    </SkeletonSuggestionRow>
  )
}
