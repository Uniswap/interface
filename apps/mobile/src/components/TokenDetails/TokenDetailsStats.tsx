import { GraphQLApi } from '@universe/api'
import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { LongText } from 'src/components/text/LongText'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ChartBar, ChartPie, ChartPyramid, Language as LanguageIcon, TrendDown, TrendUp } from 'ui/src/components/icons'
import { DEP_accentColors, validColor } from 'ui/src/theme'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
  useTokenMarketPartsFragment,
  useTokenProjectMarketsPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { Language } from 'uniswap/src/features/language/constants'
import { useCurrentLanguage, useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'

const StatsRow = memo(function _StatsRow({
  label,
  children,
  statsIcon,
}: {
  label: string
  children: JSX.Element
  statsIcon: JSX.Element
}): JSX.Element {
  return (
    <Flex row justifyContent="space-between" pl="$spacing2">
      <Flex row alignItems="center" flex={1} gap="$spacing8" justifyContent="flex-start">
        <Flex>{statsIcon}</Flex>
        <Flex flex={1}>
          <Text color="$neutral1" variant="body2">
            {label}
          </Text>
        </Flex>
      </Flex>
      <Flex>{children}</Flex>
    </Flex>
  )
})

const TokenDetailsMarketData = memo(function _TokenDetailsMarketData(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const defaultTokenColor = colors.neutral3.get()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const { currencyId, tokenColor } = useTokenDetailsContext()

  const tokenMarket = useTokenMarketPartsFragment({ currencyId }).data.market
  const projectMarkets = useTokenProjectMarketsPartsFragment({ currencyId }).data.project?.markets

  const price = projectMarkets?.[0]?.price?.value || tokenMarket?.price?.value || undefined
  const marketCap = projectMarkets?.[0]?.marketCap?.value
  const volume = tokenMarket?.volume?.value
  const rawPriceHigh52W = projectMarkets?.[0]?.priceHigh52W?.value || tokenMarket?.priceHigh52W?.value || undefined
  const rawPriceLow52W = projectMarkets?.[0]?.priceLow52W?.value || tokenMarket?.priceLow52W?.value || undefined

  // Use current price for 52w high/low if it exceeds the bounds
  const priceHight52W =
    price !== undefined && rawPriceHigh52W !== undefined ? Math.max(price, rawPriceHigh52W) : rawPriceHigh52W
  const priceLow52W =
    price !== undefined && rawPriceLow52W !== undefined ? Math.min(price, rawPriceLow52W) : rawPriceLow52W
  const fullyDilutedValuation = projectMarkets?.[0]?.fullyDilutedValuation?.value

  return (
    <Flex gap="$spacing8">
      <StatsRow
        label={t('token.stats.marketCap')}
        statsIcon={<ChartPie color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <Text textAlign="right" variant="body2">
          {convertFiatAmountFormatted(marketCap, NumberType.FiatTokenStats)}
        </Text>
      </StatsRow>

      <StatsRow
        label={t('token.stats.fullyDilutedValuation')}
        statsIcon={<ChartPyramid color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <Text textAlign="right" variant="body2">
          {convertFiatAmountFormatted(fullyDilutedValuation, NumberType.FiatTokenStats)}
        </Text>
      </StatsRow>

      <StatsRow
        label={t('token.stats.volume')}
        statsIcon={<ChartBar color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <Text textAlign="right" variant="body2">
          {convertFiatAmountFormatted(volume, NumberType.FiatTokenStats)}
        </Text>
      </StatsRow>

      <StatsRow
        label={t('token.stats.priceHighYear')}
        statsIcon={<TrendUp color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <Text textAlign="right" variant="body2">
          {convertFiatAmountFormatted(priceHight52W, NumberType.FiatTokenDetails)}
        </Text>
      </StatsRow>

      <StatsRow
        label={t('token.stats.priceLowYear')}
        statsIcon={<TrendDown color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <Text textAlign="right" variant="body2">
          {convertFiatAmountFormatted(priceLow52W, NumberType.FiatTokenDetails)}
        </Text>
      </StatsRow>
    </Flex>
  )
})

export const TokenDetailsStats = memo(function _TokenDetailsStats(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const currentLanguage = useCurrentLanguage()
  const currentLanguageInfo = useCurrentLanguageInfo()

  const [showTranslation, setShowTranslation] = useState(false)

  const { currencyId, tokenColor } = useTokenDetailsContext()

  const onChainData = useTokenBasicInfoPartsFragment({ currencyId }).data
  const offChainData = useTokenBasicProjectPartsFragment({ currencyId }).data.project

  const language = useCurrentLanguage()

  const descriptions = GraphQLApi.useTokenProjectDescriptionQuery({
    variables: {
      ...currencyIdToContractInput(currencyId),
      includeSpanish:
        language === Language.SpanishSpain ||
        language === Language.SpanishLatam ||
        language === Language.SpanishUnitedStates,
      includeFrench: language === Language.French,
      includeJapanese: language === Language.Japanese,
      includePortuguese: language === Language.Portuguese,
      includeVietnamese: language === Language.Vietnamese,
      includeChineseSimplified: language === Language.ChineseSimplified,
      includeChineseTraditional: language === Language.ChineseTraditional,
    },
    fetchPolicy: 'cache-and-network',
    returnPartialData: true,
  }).data?.token?.project

  const description = descriptions?.description

  const translatedDescription =
    descriptions?.descriptionTranslations?.descriptionEsEs ||
    descriptions?.descriptionTranslations?.descriptionFrFr ||
    descriptions?.descriptionTranslations?.descriptionJaJp ||
    descriptions?.descriptionTranslations?.descriptionPtPt ||
    descriptions?.descriptionTranslations?.descriptionViVn ||
    descriptions?.descriptionTranslations?.descriptionZhHans ||
    descriptions?.descriptionTranslations?.descriptionZhHant

  const name = offChainData?.name ?? onChainData.name
  const currentDescription = showTranslation && translatedDescription ? translatedDescription : description

  return (
    <Flex gap="$spacing24">
      {currentDescription && (
        <Flex gap="$spacing4">
          {name && (
            <Text color="$neutral2" testID={TestID.TokenDetailsAboutHeader} variant="subheading2">
              {t('token.stats.section.about', { token: name })}
            </Text>
          )}

          <Flex gap="$spacing16">
            <LongText
              gap="$spacing2"
              initialDisplayedLines={5}
              linkColor={tokenColor ?? colors.neutral1.val}
              readMoreOrLessColor={tokenColor ?? colors.neutral2.val}
              text={currentDescription.trim()}
            />
          </Flex>

          {currentLanguage !== Language.English && !!translatedDescription && (
            <TouchableArea onPress={(): void => setShowTranslation(!showTranslation)}>
              <Flex alignItems="center" backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
                {showTranslation ? (
                  <Flex row alignItems="center" gap="$spacing12" width="100%">
                    <Flex fill row alignItems="center" gap="$spacing12">
                      <LanguageIcon color="$neutral2" size="$icon.20" />
                      <Text color="$neutral2" variant="body3">
                        {currentLanguageInfo.displayName}
                      </Text>
                    </Flex>
                    <Text color={validColor(DEP_accentColors.blue400)} variant="buttonLabel2">
                      {t('token.stats.translation.original')}
                    </Text>
                  </Flex>
                ) : (
                  <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)}>
                    <Flex row alignItems="center" gap="$spacing12">
                      <LanguageIcon color="$neutral2" size="$icon.20" />
                      <Text color="$neutral2" variant="body3">
                        {t('token.stats.translation.translate', {
                          language: currentLanguageInfo.displayName,
                        })}
                      </Text>
                    </Flex>
                  </Animated.View>
                )}
              </Flex>
            </TouchableArea>
          )}
        </Flex>
      )}

      <Flex gap="$spacing4">
        <Text color="$neutral2" variant="subheading2">
          {t('token.stats.title')}
        </Text>

        <TokenDetailsMarketData />
      </Flex>
    </Flex>
  )
})
