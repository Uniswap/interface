import { InterfaceEventName } from '@uniswap/analytics-events'
import Column from 'components/Column'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import { useAddRecentlySearchedAsset } from 'components/NavBar/SearchBar/RecentlySearchedAssets'
import Row from 'components/Row'
import TokenSafetyIcon from 'components/TokenSafety/TokenSafetyIcon'
import { DeltaArrow, DeltaText } from 'components/Tokens/TokenDetails/Delta'
import { LoadingBubble } from 'components/Tokens/loading'
import { useTokenWarning } from 'constants/tokenSafety'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { SearchToken } from 'graphql/data/SearchTokens'
import { getTokenDetailsURL, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { Trans } from 'i18n'
import styled, { css } from 'lib/styled-components'
import { GenieCollection } from 'nft/types'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { Verified } from 'ui/src/components/icons'
import { Chain, TokenStandard } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { InterfaceSearchResultSelectionProperties } from 'uniswap/src/features/telemetry/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
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
const PrimaryContainer = styled(Column)`
  align-items: flex-start;
  width: 90%;
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
  suggestion: GenieCollection | SearchToken
  isHovered: boolean
  setHoveredIndex: (index: number | undefined) => void
  toggleOpen: () => void
  index: number
  eventProperties: InterfaceSearchResultSelectionProperties
}

function suggestionIsToken(suggestion: GenieCollection | SearchToken): suggestion is SearchToken {
  return (suggestion as SearchToken).decimals !== undefined
}

export function SuggestionRow({
  suggestion,
  isHovered,
  setHoveredIndex,
  toggleOpen,
  index,
  eventProperties,
}: SuggestionRowProps) {
  const isToken = suggestionIsToken(suggestion)
  const addRecentlySearchedAsset = useAddRecentlySearchedAsset()
  const navigate = useNavigate()
  const { formatFiatPrice, formatDelta, formatNumberOrString } = useFormatter()
  const [brokenCollectionImage, setBrokenCollectionImage] = useState(false)
  const warning = useTokenWarning(
    isToken ? suggestion.address : undefined,
    isToken ? supportedChainIdFromGQLChain(suggestion.chain) : UniverseChainId.Mainnet,
  )

  const handleClick = useCallback(() => {
    const address =
      !suggestion.address && suggestion.standard === TokenStandard.Native ? NATIVE_CHAIN_ID : suggestion.address
    const asset = isToken
      ? address && { address, chain: suggestion.chain }
      : { ...suggestion, isNft: true, chain: Chain.Ethereum }
    asset && addRecentlySearchedAsset(asset)

    toggleOpen()
    sendAnalyticsEvent(InterfaceEventName.NAVBAR_RESULT_SELECTED, { ...eventProperties })
  }, [suggestion, isToken, addRecentlySearchedAsset, toggleOpen, eventProperties])

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

  return (
    <StyledLink
      to={path}
      onClick={handleClick}
      $isFocused={isHovered}
      onMouseEnter={() => !isHovered && setHoveredIndex(index)}
      onMouseLeave={() => isHovered && setHoveredIndex(undefined)}
      data-testid={isToken ? `searchbar-token-row-${suggestion.chain}-${suggestion.address ?? NATIVE_CHAIN_ID}` : ''}
    >
      <Row width="60%" gap="sm">
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
        <PrimaryContainer>
          <Row gap="xs">
            <PrimaryText lineHeight="24px">{suggestion.name}</PrimaryText>
            {isToken ? <TokenSafetyIcon warning={warning} /> : suggestion.isVerified && <Verified />}
          </Row>
          <ThemedText.SubHeaderSmall lineHeight="20px">
            {isToken ? (
              suggestion.symbol
            ) : (
              <>
                {formatNumberOrString({ input: suggestion?.stats?.total_supply, type: NumberType.WholeNumber })}&nbsp;
                <Trans i18nKey="common.items" />
              </>
            )}
          </ThemedText.SubHeaderSmall>
        </PrimaryContainer>
      </Row>

      <SecondaryContainer>
        <Row gap="xs">
          <PrimaryText width="100%">
            {isToken
              ? formatFiatPrice({ price: suggestion.market?.price?.value })
              : `${formatNumberOrString({ input: suggestion.stats?.floor_price, type: NumberType.NFTToken })} ETH`}
          </PrimaryText>
        </Row>

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
      <Row>
        <BrokenCollectionImage />
        <SkeletonContent gap="sm">
          <Row justify="space-between">
            <LoadingBubble height="20px" width="180px" />
            <LoadingBubble height="20px" width="48px" />
          </Row>

          <Row justify="space-between">
            <LoadingBubble height="16px" width="120px" />
            <LoadingBubble height="16px" width="48px" />
          </Row>
        </SkeletonContent>
      </Row>
    </SkeletonSuggestionRow>
  )
}
