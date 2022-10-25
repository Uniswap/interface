import { Currency } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useFragment } from 'react-relay'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Suspense } from 'src/components/data/Suspense'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
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

const tokenDetailsStatsTokenProjectFragment = graphql`
  fragment TokenDetailsStats_tokenProject on TokenProject {
    description
    homepageUrl
    twitterName
    name
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
    <Flex gap="xl">
      <Flex row justifyContent="space-between">
        <Flex flex={1} gap="lg">
          <Flex gap="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('Market cap')}
            </Text>
            <Text variant="headlineMedium">
              {formatNumber(marketData?.marketCap?.value, NumberType.FiatTokenStats)}
            </Text>
          </Flex>
          <Flex gap="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('52W low')}
            </Text>
            <Text variant="headlineMedium">
              {formatNumber(marketData?.priceLow52W?.value, NumberType.FiatTokenDetails)}
            </Text>
          </Flex>
        </Flex>
        <Flex flex={1} gap="lg">
          <Flex gap="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('24h volume')}
            </Text>
            <Text variant="headlineMedium">
              {formatNumber(tokenData?.market.volume.value, NumberType.FiatTokenStats)}
            </Text>
          </Flex>
          <Flex gap="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('52W high')}
            </Text>
            <Text variant="headlineMedium">
              {formatNumber(marketData?.priceHigh52W?.value, NumberType.FiatTokenDetails)}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex gap="xs">
        <Text color="textSecondary" variant="subheadSmall">
          {t('About {{ token }}', { token: tokenProjectData.name })}
        </Text>
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
