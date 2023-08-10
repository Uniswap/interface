import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import StatsIcon from 'ui/src/assets/icons/chart-bar.svg'
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
  const theme = useAppTheme()
  return (
    <Flex row justifyContent="space-between" paddingLeft="spacing2">
      <Flex row alignItems="center" gap="spacing8" justifyContent="flex-start">
        <StatsIcon
          color={tokenColor ?? theme.colors.neutral3}
          height={theme.iconSizes.icon12}
          width={theme.iconSizes.icon12}
        />
        <Text color="neutral1" variant="bodySmall">
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
        <Text loading={isLoading} variant="buttonLabelSmall">
          {formatNumber(value, numberType)}
        </Text>
      )
    },
    [isLoading]
  )

  return (
    <Flex gap="spacing8">
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
  const theme = useAppTheme()

  const tokenData = data?.token
  const tokenProjectData = tokenData?.project

  const marketData = tokenProjectData?.markets ? tokenProjectData.markets[0] : null

  return (
    <Flex gap="spacing24">
      {tokenProjectData?.description && (
        <Flex gap="spacing4">
          {tokenProjectData?.name && (
            <Text color="neutral2" variant="subheadSmall">
              {t('About {{ token }}', { token: tokenProjectData.name })}
            </Text>
          )}
          <Flex gap="spacing16">
            <LongText
              gap="spacing2"
              initialDisplayedLines={5}
              linkColor={tokenColor ?? theme.colors.neutral1}
              readMoreOrLessColor={tokenColor ?? theme.colors.accent1}
              text={tokenProjectData.description.trim()}
            />
          </Flex>
        </Flex>
      )}
      <Flex gap="spacing4">
        <Text color="neutral2" variant="subheadSmall">
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
