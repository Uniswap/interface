import { SharedEventName } from '@uniswap/analytics-events'
import { FeatureFlags } from '@universe/gating'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { useGatedTokenDetailsRWAMatch } from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { Flex, Text, TouchableArea } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getRWAIssuerDisplayName } from 'uniswap/src/features/rwa/issuers'
import type { RWAToken } from 'uniswap/src/features/rwa/types'
import { type RWAIssuerMarketData, useRWAIssuerMarketData } from 'uniswap/src/features/rwa/useRWAIssuerMarketData'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

const COLLAPSED_VISIBLE_COUNT = 2

export function MoreRwaTokens(): JSX.Element | null {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const rwaMatch = useGatedTokenDetailsRWAMatch(FeatureFlags.RWATdpSiblings)
  const otherIssuerTokens = useMemo(
    () => rwaMatch?.asset.tokens.filter((token) => token.issuer !== rwaMatch.token.issuer) ?? [],
    [rwaMatch],
  )
  const getMarketData = useRWAIssuerMarketData(otherIssuerTokens)

  if (!rwaMatch || otherIssuerTokens.length === 0) {
    return null
  }

  const companyName = rwaMatch.asset.name || rwaMatch.asset.symbol
  const useExpando = otherIssuerTokens.length > COLLAPSED_VISIBLE_COUNT
  const visibleTokens =
    useExpando && !isExpanded ? otherIssuerTokens.slice(0, COLLAPSED_VISIBLE_COUNT) : otherIssuerTokens
  const hiddenCount = otherIssuerTokens.length - COLLAPSED_VISIBLE_COUNT

  return (
    <Flex gap="$spacing12" px="$spacing16" testID={TestID.TokenDetailsRWAMoreWaysToTrade}>
      <Text color="$neutral2" mx="$spacing8" variant="subheading2">
        {t('tdp.rwa.moreTokens', { company: companyName })}
      </Text>
      <Flex gap="$spacing8" mx="$spacing8">
        {visibleTokens.map((token) => (
          <IssuerTokenCard
            key={`${token.chainId}-${token.address}`}
            token={token}
            assetName={companyName}
            marketData={getMarketData(token)}
          />
        ))}
      </Flex>
      {useExpando ? (
        <ExpandoRow
          color="$neutral2"
          isExpanded={isExpanded}
          label={isExpanded ? t('common.button.showLess') : t('tdp.rwa.moreTokensCount', { count: hiddenCount })}
          mx="$spacing8"
          onPress={() => setIsExpanded((prev) => !prev)}
        />
      ) : null}
    </Flex>
  )
}

function IssuerTokenCard({
  token,
  assetName,
  marketData,
}: {
  token: RWAToken
  assetName: string
  marketData: RWAIssuerMarketData
}): JSX.Element {
  const { t } = useTranslation()
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const displayName = getRWAIssuerDisplayName(token.issuer)
  const priceLabel = convertFiatAmountFormatted(marketData.priceUsd, NumberType.FiatTokenDetails)
  const marketCapLabel = convertFiatAmountFormatted(marketData.marketCapUsd, NumberType.FiatTokenStats)
  const volumeLabel = convertFiatAmountFormatted(marketData.volume24hUsd, NumberType.FiatTokenStats)

  const onPress = (): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TDPRwaTokenVariant,
      issuer: token.issuer,
      token_address: token.address,
      token_symbol: token.symbol,
    })
    const currencyId = buildCurrencyId(token.chainId as UniverseChainId, token.address)
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigateWithPop(currencyId)
  }

  return (
    <TouchableArea
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      gap="$spacing12"
      p="$spacing12"
      testID={TestID.TokenDetailsRWAIssuerCard}
      onPress={onPress}
    >
      <Flex row alignItems="center" justifyContent="space-between" gap="$spacing8" pr="$spacing4">
        <Flex row shrink alignItems="center" gap="$spacing8" flex={1}>
          <TokenLogo hideNetworkLogo url={token.logoUrl} symbol={token.symbol} name={token.name} size={40} />
          <Flex shrink flex={1}>
            <Flex row shrink alignItems="baseline" gap="$spacing6">
              <Text color="$neutral1" numberOfLines={1} variant="body2">
                {assetName}
              </Text>
              <Text color="$neutral3" numberOfLines={1} variant="body3">
                {displayName}
              </Text>
            </Flex>
            <Text color="$neutral2" numberOfLines={1} variant="body3">
              {token.symbol.toUpperCase()}
            </Text>
          </Flex>
        </Flex>
        <Text color="$neutral1" numberOfLines={1} textAlign="right" variant="body1">
          {priceLabel}
        </Text>
      </Flex>
      <Flex row alignItems="center" gap="$spacing12">
        <Text color="$neutral2" numberOfLines={1} variant="body3">
          {t('tdp.rwa.stats.marketCap', { value: marketCapLabel })}
        </Text>
        <Flex backgroundColor="$neutral3" borderRadius="$roundedFull" height={4} width={4} />
        <Text color="$neutral2" numberOfLines={1} variant="body3">
          {t('tdp.rwa.stats.volume1d', { value: volumeLabel })}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
