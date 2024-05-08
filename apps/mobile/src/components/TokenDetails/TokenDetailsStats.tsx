import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { LongText } from 'src/components/text/LongText'
import { Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenDetailsScreenQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NumberType } from 'utilities/src/format/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { Language } from 'wallet/src/features/language/constants'
import { useCurrentLanguage, useCurrentLanguageInfo } from 'wallet/src/features/language/hooks'

function StatsRow({
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
      <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-start">
        {statsIcon}
        <Text color="$neutral1" variant="body2">
          {label}
        </Text>
      </Flex>
      {children}
    </Flex>
  )
}

export function TokenDetailsMarketData({
  fullyDilutedValuation,
  marketCap,
  volume,
  priceLow52W,
  priceHight52W,
  isLoading = false,
  tokenColor,
}: {
  fullyDilutedValuation?: number
  marketCap?: number
  volume?: number
  priceLow52W?: number
  priceHight52W?: number
  isLoading?: boolean
  tokenColor?: Nullable<string>
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const defaultTokenColor = colors.neutral3.get()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  return (
    <Flex gap="$spacing8">
      <StatsRow
        label={t('token.stats.marketCap')}
        statsIcon={
          <Icons.ChartPie color={tokenColor ?? defaultTokenColor} size={iconSizes.icon16} />
        }>
        <Text loading={isLoading} variant="body2">
          {convertFiatAmountFormatted(marketCap, NumberType.FiatTokenStats)}
        </Text>
      </StatsRow>
      <StatsRow
        label={t('token.stats.fullyDilutedValuation')}
        statsIcon={
          <Icons.ChartPie color={tokenColor ?? defaultTokenColor} size={iconSizes.icon16} />
        }>
        <Text loading={isLoading} variant="body2">
          {convertFiatAmountFormatted(fullyDilutedValuation, NumberType.FiatTokenStats)}
        </Text>
      </StatsRow>
      <StatsRow
        label={t('token.stats.volume')}
        statsIcon={
          <Icons.ChartBar color={tokenColor ?? defaultTokenColor} size={iconSizes.icon16} />
        }>
        <Text loading={isLoading} variant="body2">
          {convertFiatAmountFormatted(volume, NumberType.FiatTokenStats)}
        </Text>
      </StatsRow>
      <StatsRow
        label={t('token.stats.priceHighYear')}
        statsIcon={
          <Icons.TrendUp color={tokenColor ?? defaultTokenColor} size={iconSizes.icon16} />
        }>
        <Text loading={isLoading} variant="body2">
          {convertFiatAmountFormatted(priceHight52W, NumberType.FiatTokenDetails)}
        </Text>
      </StatsRow>
      <StatsRow
        label={t('token.stats.priceLowYear')}
        statsIcon={
          <Icons.TrendDown color={tokenColor ?? defaultTokenColor} size={iconSizes.icon16} />
        }>
        <Text loading={isLoading} variant="body2">
          {convertFiatAmountFormatted(priceLow52W, NumberType.FiatTokenDetails)}
        </Text>
      </StatsRow>
    </Flex>
  )
}

export function TokenDetailsStats({
  data,
  tokenColor,
}: {
  data: TokenDetailsScreenQuery | undefined
  tokenColor?: Maybe<string>
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const currentLanguage = useCurrentLanguage()
  const currentLanguageInfo = useCurrentLanguageInfo()

  const [showTranslation, setShowTranslation] = useState(false)

  const onChainData = data?.token
  const offChainData = data?.token?.project

  const description = offChainData?.description
  const translatedDescription =
    offChainData?.descriptionTranslations?.descriptionEsEs ||
    offChainData?.descriptionTranslations?.descriptionFrFr ||
    offChainData?.descriptionTranslations?.descriptionJaJp ||
    offChainData?.descriptionTranslations?.descriptionPtPt ||
    offChainData?.descriptionTranslations?.descriptionZhHans ||
    offChainData?.descriptionTranslations?.descriptionZhHant
  const name = offChainData?.name ?? onChainData?.name
  const marketCap = offChainData?.markets?.[0]?.marketCap?.value
  const volume = onChainData?.market?.volume?.value
  const priceHight52W =
    offChainData?.markets?.[0]?.priceHigh52W?.value ?? onChainData?.market?.priceHigh52W?.value
  const priceLow52W =
    offChainData?.markets?.[0]?.priceLow52W?.value ?? onChainData?.market?.priceLow52W?.value
  const fullyDilutedValuation = offChainData?.markets?.[0]?.fullyDilutedValuation?.value
  const currentDescription =
    showTranslation && translatedDescription ? translatedDescription : description

  return (
    <Flex gap="$spacing24">
      {currentDescription && (
        <Flex gap="$spacing4">
          {name && (
            <Text color="$neutral2" variant="subheading2">
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
            <TouchableArea
              hapticFeedback
              onPress={(): void => setShowTranslation(!showTranslation)}>
              <Flex
                alignItems="center"
                backgroundColor="$surface3"
                borderRadius="$rounded12"
                p="$spacing12">
                {showTranslation ? (
                  <Flex row alignItems="center" gap="$spacing12" width="100%">
                    <Flex fill row alignItems="center" gap="$spacing12">
                      <Icons.Language color="$neutral2" size="$icon.20" />
                      <Text color="$neutral2" variant="body3">
                        {currentLanguageInfo.displayName}
                      </Text>
                    </Flex>
                    <Text color="$blue400" variant="buttonLabel4">
                      {t('token.stats.translation.original')}
                    </Text>
                  </Flex>
                ) : (
                  <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)}>
                    <Flex row alignItems="center" gap="$spacing12">
                      <Icons.Language color="$neutral2" size="$icon.20" />
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
        <TokenDetailsMarketData
          fullyDilutedValuation={fullyDilutedValuation}
          marketCap={marketCap}
          priceHight52W={priceHight52W}
          priceLow52W={priceLow52W}
          tokenColor={tokenColor}
          volume={volume}
        />
      </Flex>
    </Flex>
  )
}
