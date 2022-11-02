import { Currency } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useFragment } from 'react-relay'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Suspense } from 'src/components/data/Suspense'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Shimmer } from 'src/components/loading/Shimmer'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { TokenDetailsStats_token$key } from 'src/components/TokenDetails/__generated__/TokenDetailsStats_token.graphql'
import { TokenDetailsStats_tokenProject$key } from 'src/components/TokenDetails/__generated__/TokenDetailsStats_tokenProject.graphql'
import { currencyAddress } from 'src/utils/currencyId'
import { formatNumber, NumberType } from 'src/utils/format'
import { ExplorerDataType, getExplorerLink, getTwitterLink } from 'src/utils/linking'

// Fetch Uniswap volume from Token#markets
export const tokenDetailsStatsTokenFragment = graphql`
  fragment TokenDetailsStats_token on Token {
    market(currency: USD) @required(action: LOG) {
      volume(duration: DAY) @required(action: LOG) {
        value @required(action: LOG)
      }
    }
  }
`

export const tokenDetailsStatsTokenProjectFragment = graphql`
  fragment TokenDetailsStats_tokenProject on TokenProject {
    description
    homepageUrl
    twitterName
    name
    safetyLevel
    markets(currencies: [USD]) {
      price {
        value
        currency
      }
      marketCap {
        value
        currency
      }
      fullyDilutedMarketCap {
        value
        currency
      }
      priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
        value
        currency
      }
      priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
        value
        currency
      }
    }
    tokens {
      chain
      address
      symbol
      decimals
    }
  }
`

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
}) {
  const { t } = useTranslation()

  // Utility component to render formatted values
  const FormattedValue = useCallback(
    ({ value, numberType }: { value?: number; numberType: NumberType }) => {
      if (isLoading) {
        return (
          <Shimmer>
            <Text loaderOnly height="100%" variant="bodyLarge" width="50%">
              $0.00
            </Text>
          </Shimmer>
        )
      }
      return <Text variant="bodyLarge">{formatNumber(value, numberType)}</Text>
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

function TokenDetailsStatsInner({
  currency,
  token,
  tokenProject,
}: {
  currency: Currency
  token: TokenDetailsStats_token$key
  tokenProject: TokenDetailsStats_tokenProject$key
}) {
  const { t } = useTranslation()

  const tokenData = useFragment(tokenDetailsStatsTokenFragment, token)
  const tokenProjectData = useFragment(tokenDetailsStatsTokenProjectFragment, tokenProject)

  const marketData = tokenProjectData?.markets ? tokenProjectData.markets[0] : null

  if (!tokenProject || !marketData) return null

  const explorerLink = getExplorerLink(
    currency.chainId,
    currencyAddress(currency),
    ExplorerDataType.ADDRESS
  )

  return (
    <Flex gap="lg">
      <Text variant="subheadLarge">{t('Stats')}</Text>
      <TokenDetailsMarketData
        marketCap={marketData?.marketCap?.value}
        priceHight52W={marketData.priceHigh52W?.value}
        priceLow52W={marketData.priceLow52W?.value}
        volume={tokenData?.market.volume.value}
      />
      <Flex gap="xxs">
        <Text color="textTertiary" variant="subheadSmall">
          {t('About {{ token }}', { token: tokenProjectData.name })}
        </Text>
        <Flex gap="sm">
          {tokenProjectData.description && (
            <LongText
              gap="xxxs"
              initialDisplayedLines={5}
              text={tokenProjectData.description.trim()}
            />
          )}
          <Flex row>
            {tokenProjectData.homepageUrl && (
              <LinkButton
                color="accentAction"
                label={t('Website')}
                textVariant="buttonLabelMicro"
                url={tokenProjectData.homepageUrl}
              />
            )}
            {tokenProjectData.twitterName && (
              <LinkButton
                color="accentAction"
                label={t('Twitter')}
                textVariant="buttonLabelMicro"
                url={getTwitterLink(tokenProjectData.twitterName)}
              />
            )}
            <LinkButton
              color="accentAction"
              label={t('Etherscan')}
              textVariant="buttonLabelMicro"
              url={explorerLink}
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export function TokenDetailsStats({
  currency,
  token,
  tokenProject,
}: {
  currency: Currency
  token: TokenDetailsStats_token$key | null | undefined
  tokenProject: TokenDetailsStats_tokenProject$key | null | undefined
}) {
  if (!token || !tokenProject) return null
  return (
    <Suspense fallback={<Loading />}>
      <TokenDetailsStatsInner currency={currency} token={token} tokenProject={tokenProject} />
    </Suspense>
  )
}
