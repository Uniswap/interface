import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { TokenDetailsScreenQuery } from 'src/data/__generated__/types-and-hooks'
import { currencyIdToAddress, currencyIdToChain } from 'src/utils/currencyId'
import { formatNumber, NumberType } from 'src/utils/format'
import { ExplorerDataType, getExplorerLink, getTwitterLink } from 'src/utils/linking'

export function TokenDetailsMarketData({
  marketCap,
  volume,
  priceLow52W,
  priceHight52W,
  isLoading = false,
}: {
  marketCap?: number
  volume?: number
  priceLow52W?: number
  priceHight52W?: number
  isLoading?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  // Utility component to render formatted values
  const FormattedValue = useCallback(
    ({ value, numberType }: { value?: number; numberType: NumberType }) => {
      return (
        <Text loading={isLoading} variant="bodyLarge">
          {formatNumber(value, numberType)}
        </Text>
      )
    },
    [isLoading]
  )

  return (
    <Flex row justifyContent="space-between">
      <Flex flex={1} gap="lg">
        <Flex gap="xxs">
          <Text color="textTertiary" variant="subheadSmall">
            {t('Market cap')}
          </Text>
          <FormattedValue numberType={NumberType.FiatTokenStats} value={marketCap} />
        </Flex>
        <Flex gap="xxs">
          <Text color="textTertiary" variant="subheadSmall">
            {t('52W low')}
          </Text>
          <FormattedValue numberType={NumberType.FiatTokenDetails} value={priceLow52W} />
        </Flex>
      </Flex>
      <Flex flex={1} gap="lg">
        <Flex gap="xxs">
          <Text color="textTertiary" variant="subheadSmall">
            {t('24h Uniswap volume')}
          </Text>
          <FormattedValue numberType={NumberType.FiatTokenStats} value={volume} />
        </Flex>
        <Flex gap="xxs">
          <Text color="textTertiary" variant="subheadSmall">
            {t('52W high')}
          </Text>
          <FormattedValue numberType={NumberType.FiatTokenDetails} value={priceHight52W} />
        </Flex>
      </Flex>
    </Flex>
  )
}

export function TokenDetailsStats({
  currencyId,
  data,
  tokenColor,
}: {
  currencyId: string
  data: TokenDetailsScreenQuery | undefined
  tokenColor?: NullUndefined<string>
}): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const tokenData = data?.token
  const tokenProjectData = tokenData?.project

  const marketData = tokenProjectData?.markets ? tokenProjectData.markets[0] : null

  const chainId = currencyIdToChain(currencyId)
  const address = currencyIdToAddress(currencyId)

  const explorerLink = getExplorerLink(chainId, address, ExplorerDataType.ADDRESS)

  return (
    <Flex gap="lg">
      <Text variant="subheadLarge">{t('Stats')}</Text>
      <TokenDetailsMarketData
        marketCap={marketData?.marketCap?.value}
        priceHight52W={marketData?.priceHigh52W?.value}
        priceLow52W={marketData?.priceLow52W?.value}
        volume={tokenData?.market?.volume?.value}
      />
      <Flex gap="xxs">
        {tokenData?.name ? (
          <Text color="textTertiary" variant="subheadSmall">
            {t('About {{ token }}', { token: tokenData.name })}
          </Text>
        ) : null}
        <Flex gap="md">
          {tokenProjectData?.description && (
            <LongText
              gap="xxxs"
              initialDisplayedLines={5}
              linkColor={tokenColor ?? theme.colors.textPrimary}
              readMoreOrLessColor={tokenColor ?? theme.colors.accentAction}
              text={tokenProjectData.description.trim()}
            />
          )}
          <Flex row>
            {tokenProjectData?.homepageUrl && (
              <LinkButton
                color={tokenColor ?? theme.colors.textSecondary}
                label={t('Website')}
                textVariant="buttonLabelSmall"
                url={tokenProjectData.homepageUrl}
              />
            )}
            {tokenProjectData?.twitterName && (
              <LinkButton
                color={tokenColor ?? theme.colors.textSecondary}
                label={t('Twitter')}
                textVariant="buttonLabelSmall"
                url={getTwitterLink(tokenProjectData.twitterName)}
              />
            )}
            <LinkButton
              color={tokenColor ?? theme.colors.textSecondary}
              label={t('Etherscan')}
              textVariant="buttonLabelSmall"
              url={explorerLink}
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
