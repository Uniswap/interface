import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import StatsIcon from 'src/assets/icons/chart-bar.svg'
import GlobeIcon from 'src/assets/icons/globe-filled.svg'
import EtherscanIcon from 'src/assets/icons/sticky-note-text-square.svg'
import TwitterIcon from 'src/assets/icons/twitter.svg'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { TokenDetailsScreenQuery } from 'src/data/__generated__/types-and-hooks'
import { currencyIdToAddress, currencyIdToChain } from 'src/utils/currencyId'
import { formatNumber, NumberType } from 'src/utils/format'
import { ExplorerDataType, getExplorerLink, getTwitterLink } from 'src/utils/linking'
import { LinkButtonWithIcon } from './LinkButtonWithIcon'

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
          color={tokenColor ?? theme.colors.textTertiary}
          height={theme.iconSizes.icon12}
          width={theme.iconSizes.icon12}
        />
        <Text color="textPrimary" variant="bodySmall">
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
    <Flex gap="spacing24">
      <Flex gap="spacing4">
        {tokenData?.name ? (
          <Text color="textTertiary" variant="subheadSmall">
            {t('About {{ token }}', { token: tokenData.name })}
          </Text>
        ) : null}
        <Flex gap="spacing16">
          {tokenProjectData?.description && (
            <LongText
              gap="spacing2"
              initialDisplayedLines={5}
              linkColor={tokenColor ?? theme.colors.textPrimary}
              readMoreOrLessColor={tokenColor ?? theme.colors.accentAction}
              text={tokenProjectData.description.trim()}
            />
          )}
        </Flex>
      </Flex>
      <Flex gap="spacing4">
        <Text color="textTertiary" variant="subheadSmall">
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
      <Flex gap="spacing8">
        <Text color="textTertiary" variant="subheadSmall">
          {t('Links')}
        </Text>
        <Flex row gap="spacing8">
          {tokenProjectData?.homepageUrl && (
            <LinkButtonWithIcon
              Icon={GlobeIcon}
              label={t('Website')}
              url={tokenProjectData.homepageUrl}
            />
          )}
          {tokenProjectData?.twitterName && (
            <LinkButtonWithIcon
              Icon={TwitterIcon}
              label={t('Twitter')}
              url={getTwitterLink(tokenProjectData.twitterName)}
            />
          )}
          <LinkButtonWithIcon Icon={EtherscanIcon} label={t('Etherscan')} url={explorerLink} />
        </Flex>
      </Flex>
    </Flex>
  )
}
