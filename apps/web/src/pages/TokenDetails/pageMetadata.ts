import { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { TFunction } from 'i18next'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, getChainLabel } from 'uniswap/src/features/chains/utils'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'

export function getTokenStructuredData({
  tokenQueryData,
  price,
  pageDescription,
}: {
  tokenQueryData: GraphQLApi.TokenWebQuery['token']
  price: number | undefined
  pageDescription: string
}): Record<string, unknown>[] | null {
  if (!tokenQueryData) {
    return null
  }

  const chainUrlParam = getChainInfo(fromGraphQLChain(tokenQueryData.chain) ?? UniverseChainId.Mainnet).urlParam
  const tokenDetailsUrl = `${uniswapUrls.webInterfaceTokensUrl}/${chainUrlParam}/${tokenQueryData.address ?? NATIVE_CHAIN_ID}`
  return [
    {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: `${tokenQueryData.name}${tokenQueryData.symbol ? ` (${tokenQueryData.symbol})` : ''}`,
      image: tokenQueryData.project?.logoUrl ? [tokenQueryData.project.logoUrl] : [],
      description: pageDescription,
      offers: {
        '@type': 'Offer',
        priceCurrency: tokenQueryData.market?.price?.currency ?? 'USD',
        price: price ?? 0,
        url: tokenDetailsUrl,
      },
    },
    {
      '@context': 'https://schema.org/',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Explore',
          item: uniswapUrls.webInterfaceTokensUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: tokenQueryData.name,
          item: tokenDetailsUrl,
        },
      ],
    },
  ]
}

export function getTokenPageTitle({
  t,
  currency,
  chainId,
}: {
  t: TFunction
  currency?: Currency
  chainId?: UniverseChainId
}) {
  const tokenName = currency?.name
  const tokenSymbol = currency?.symbol
  const baseTitle = t('common.buyAndSell')
  if (!tokenName && !tokenSymbol) {
    return baseTitle
  }

  const chainSuffix = chainId && chainId !== UniverseChainId.Mainnet ? ` on ${getChainLabel(chainId)}` : ''
  if (!tokenName && tokenSymbol) {
    return `${tokenSymbol}${chainSuffix}: ${baseTitle}`
  }
  if (tokenName && !tokenSymbol) {
    return `${tokenName}${chainSuffix}: ${baseTitle}`
  }
  return `${tokenName} (${tokenSymbol})${chainSuffix}: ${baseTitle}`
}

export const getTokenPageDescription = ({
  currency,
  chainId,
  price,
}: {
  currency?: Currency
  chainId?: UniverseChainId
  price?: string
}) => {
  const tokenPageName =
    currency?.name && currency.symbol
      ? `${currency.name} (${currency.symbol})`
      : (currency?.name ?? currency?.symbol ?? 'tokens')
  const chainSuffix = chainId && chainId !== UniverseChainId.Mainnet ? ` on ${getChainLabel(chainId)}` : ''

  const priceText = price ? ` Current price: ${price}` : ''

  return `Buy, sell, and swap ${tokenPageName}${chainSuffix}. View real-time prices, charts, trading data, and more.${priceText}`
}
