import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { LongText } from 'src/components/text/LongText'
import { Flex, Text, useSporeColors } from 'ui/src'
import StatsIcon from 'ui/src/assets/icons/chart-bar.svg'
import { iconSizes } from 'ui/src/theme'
import { formatNumber, NumberType } from 'utilities/src/format/format'
import { TokenDetailsScreenQuery } from 'wallet/src/data/__generated__/types-and-hooks'

function StatsRow({
  label,
  children,
  tokenColor,
}: {
  label: string
  children: JSX.Element
  tokenColor?: Nullable<string>
}): JSX.Element {
  const colors = useSporeColors()
  return (
    <Flex row justifyContent="space-between" pl="$spacing2">
      <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-start">
        <StatsIcon
          color={tokenColor ?? colors.neutral3.val}
          height={iconSizes.icon12}
          width={iconSizes.icon12}
        />
        <Text color="$neutral1" variant="body2">
          {label}
        </Text>
      </Flex>
      {children}
    </Flex>
  )
}

export function TokenDetailsMarketData({
  marketCap,
  volume,
  priceLow52W,
  priceHight52W,
  isLoading = false,
  tokenColor,
}: {
  marketCap?: number
  volume?: number
  priceLow52W?: number
  priceHight52W?: number
  isLoading?: boolean
  tokenColor?: Nullable<string>
}): JSX.Element {
  const { t } = useTranslation()

  // Utility component to render formatted values
  const FormattedValue = useCallback(
    ({ value, numberType }: { value?: number; numberType: NumberType }) => {
      return (
        <Text loading={isLoading} variant="body2">
          {formatNumber(value, numberType)}
        </Text>
      )
    },
    [isLoading]
  )

  return (
    <Flex gap="$spacing8">
      <StatsRow label={t('24h Uniswap volume')} tokenColor={tokenColor}>
        <FormattedValue numberType={NumberType.FiatTokenStats} value={volume} />
      </StatsRow>
      <StatsRow label={t('Market cap')} tokenColor={tokenColor}>
        <FormattedValue numberType={NumberType.FiatTokenStats} value={marketCap} />
      </StatsRow>
      <StatsRow label={t('52W high')} tokenColor={tokenColor}>
        <FormattedValue numberType={NumberType.FiatTokenDetails} value={priceHight52W} />
      </StatsRow>
      <StatsRow label={t('52W low')} tokenColor={tokenColor}>
        <FormattedValue numberType={NumberType.FiatTokenDetails} value={priceLow52W} />
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

  const tokenData = data?.token
  const tokenProjectData = tokenData?.project

  const marketData = tokenProjectData?.markets ? tokenProjectData.markets[0] : null

  return (
    <Flex gap="$spacing24">
      {tokenProjectData?.description && (
        <Flex gap="$spacing4">
          {tokenProjectData?.name && (
            <Text color="$neutral2" variant="subheading2">
              {t('About {{ token }}', { token: tokenProjectData.name })}
            </Text>
          )}
          <Flex gap="$spacing16">
            <LongText
              gap="$spacing2"
              initialDisplayedLines={5}
              linkColor={tokenColor ?? colors.neutral1.val}
              readMoreOrLessColor={tokenColor ?? colors.neutral2.val}
              text={tokenProjectData.description.trim()}
            />
          </Flex>
        </Flex>
      )}
      <Flex gap="$spacing4">
        <Text color="$neutral2" variant="subheading2">
          {t('Stats')}
        </Text>
        <TokenDetailsMarketData
          marketCap={marketData?.marketCap?.value}
          priceHight52W={marketData?.priceHigh52W?.value}
          priceLow52W={marketData?.priceLow52W?.value}
          tokenColor={tokenColor}
          volume={tokenData?.market?.volume?.value}
        />
      </Flex>
    </Flex>
  )
}
