import { Currency } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useLazyLoadQuery } from 'react-relay'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { TokenDetailsStatsQuery } from 'src/components/TokenDetails/__generated__/TokenDetailsStatsQuery.graphql'
import { toGraphQLChain } from 'src/utils/chainId'
import { graphQLCurrencyInfo } from 'src/utils/currencyId'
import { formatPrice, formatUSDPrice } from 'src/utils/format'
import { ExplorerDataType, getExplorerLink, getTwitterLink } from 'src/utils/linking'

const tokenDetailsStatsQuery = graphql`
  query TokenDetailsStatsQuery($contract: ContractInput!) {
    tokenProjects(contracts: [$contract]) {
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
        volume24h: volume(duration: DAY) {
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
  }
`

function formatTokenPrice(price: NullUndefined<number>) {
  if (!price) return '-'
  return price < 1 ? formatPrice(price) : formatUSDPrice(price)
}

function TokenDetailsStatsInner({ currency }: { currency: Currency }) {
  const { t } = useTranslation()

  const { address, chain } = graphQLCurrencyInfo(currency)
  const graphQLChain = toGraphQLChain(chain)
  const data = useLazyLoadQuery<TokenDetailsStatsQuery>(tokenDetailsStatsQuery, {
    contract: {
      address,
      chain: graphQLChain ?? 'ETHEREUM',
    },
  })

  if (
    !graphQLChain ||
    !data.tokenProjects ||
    data.tokenProjects.length < 1 ||
    !data.tokenProjects[0]
  )
    return null

  const tokenProject = data.tokenProjects[0]
  const marketData = tokenProject.markets ? tokenProject.markets[0] : null

  const explorerLink = getExplorerLink(
    currency.chainId,
    currency.wrapped.address,
    ExplorerDataType.ADDRESS
  )

  return (
    <Flex gap="xl" p="md">
      <Flex row justifyContent="space-between">
        <Flex flex={1} gap="lg">
          <Flex gap="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('Market cap')}
            </Text>
            <Text variant="headlineMedium">{formatPrice(marketData?.marketCap?.value)}</Text>
          </Flex>
          <Flex gap="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('52W low')}
            </Text>
            <Text variant="headlineMedium">{formatTokenPrice(marketData?.priceLow52W?.value)}</Text>
          </Flex>
        </Flex>
        <Flex flex={1} gap="lg">
          <Flex gap="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('24h volume')}
            </Text>
            <Text variant="headlineMedium">{formatPrice(marketData?.volume24h?.value)}</Text>
          </Flex>
          <Flex gap="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('52W high')}
            </Text>
            <Text variant="headlineMedium">
              {formatTokenPrice(marketData?.priceHigh52W?.value)}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex gap="xs" pb="xxxl">
        <Text color="textSecondary" variant="subheadSmall">
          {t('About {{ token }}', { token: tokenProject.name ?? currency.name })}
        </Text>
        {tokenProject.description && (
          <LongText
            gap="xxxs"
            initialDisplayedLines={5}
            text={tokenProject.description.trim()}
            variant="bodySmall"
          />
        )}
        <Flex row>
          {tokenProject.homepageUrl && (
            <LinkButton
              color="accentAction"
              label={t('Website')}
              textVariant="caption"
              url={tokenProject.homepageUrl}
            />
          )}
          {tokenProject.twitterName && (
            <LinkButton
              color="accentAction"
              label={t('Twitter')}
              textVariant="caption"
              url={getTwitterLink(tokenProject.twitterName)}
            />
          )}
          <LinkButton
            color="accentAction"
            label={t('Etherscan')}
            textVariant="caption"
            url={explorerLink}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}

export function TokenDetailsStats({ currency }: { currency: Currency }) {
  return (
    <Suspense fallback={<Loading />}>
      <TokenDetailsStatsInner currency={currency} />
    </Suspense>
  )
}
