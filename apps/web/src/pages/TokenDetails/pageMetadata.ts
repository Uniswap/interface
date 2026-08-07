import type { PlainMessage } from '@bufbuild/protobuf'
import { TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'

export function getTokenStructuredData({
  token,
  price,
  pageDescription,
}: {
  token: PlainMessage<Token> | undefined
  price: number | undefined
  pageDescription: string
}): Record<string, unknown>[] | null {
  if (!token) {
    return null
  }

  const chainId = isUniverseChainId(token.chainId) ? token.chainId : UniverseChainId.Mainnet
  const chainUrlParam = getChainInfo(chainId).urlParam
  // V2 tokens always carry a real indexed address; native pages still use the NATIVE url segment
  const urlAddress = token.type === TokenType.NATIVE ? NATIVE_CHAIN_ID : token.address
  const tokenDetailsUrl = `${UniswapStaticUrls.webInterfaceTokensUrl}/${chainUrlParam}/${urlAddress}`
  return [
    {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: `${token.name}${token.symbol ? ` (${token.symbol})` : ''}`,
      image: token.project?.logoUrl ? [token.project.logoUrl] : [],
      description: pageDescription,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
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
          item: UniswapStaticUrls.webInterfaceTokensUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: token.name,
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
