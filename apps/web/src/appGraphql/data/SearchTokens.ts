import {
  SpamCode as SearchSpamCode,
  SearchType,
  type Token as SearchToken,
} from '@uniswap/client-search/dist/search/v1/api_pb'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useMemo } from 'react'
import {
  Chain,
  ProtectionInfo,
  SafetyLevel,
  TokenStandard,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useSearchTokensQuery } from 'uniswap/src/data/rest/searchTokens'
import { parseProtectionInfo, parseSafetyLevel } from 'uniswap/src/data/rest/utils'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { isUniverseChainId } from 'uniswap/src/features/chains/types'
import { isBackendSupportedChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'

export interface GqlSearchToken {
  chain: Chain
  decimals?: number
  address?: string
  symbol?: string
  name?: string
  standard?: TokenStandard
  feeData?: {
    buyFeeBps?: string
    sellFeeBps?: string
  }
  protectionInfo?: ProtectionInfo
  market?: {
    price?: { value?: number | null }
    pricePercentChange?: { value?: number | null }
  }
  project?: {
    logo?: { url?: string | null }
    logoUrl?: string | null
    name?: string | null
    safetyLevel?: SafetyLevel
    isSpam?: boolean
  }
  logo?: string | null
}

function mapSearchToken(token: SearchToken): GqlSearchToken | undefined {
  if (!isUniverseChainId(token.chainId)) {
    return undefined
  }

  const chain = toGraphQLChain(token.chainId)
  if (!chain) {
    return undefined
  }

  return {
    chain,
    address: token.address === 'ETH' ? NATIVE_CHAIN_ID : token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
    feeData: token.feeData
      ? {
          buyFeeBps:
            token.feeData.buyFeeBps !== undefined && token.feeData.buyFeeBps !== null
              ? String(token.feeData.buyFeeBps)
              : undefined,
          sellFeeBps:
            token.feeData.sellFeeBps !== undefined && token.feeData.sellFeeBps !== null
              ? String(token.feeData.sellFeeBps)
              : undefined,
        }
      : undefined,
    protectionInfo: parseProtectionInfo(token.protectionInfo),
    project: {
      logoUrl: token.logoUrl,
      name: token.projectName ?? token.name,
      safetyLevel: parseSafetyLevel(token.safetyLevel),
      isSpam: token.spamCode !== SearchSpamCode.NOT_SPAM,
    },
  }
}

// Filters out results that are undefined, or where the token's chain is not supported in explore.
function isExploreSupportedToken(token: GqlSearchToken | undefined): token is GqlSearchToken {
  return token !== undefined && isBackendSupportedChain(token.chain)
}

export function useSearchTokensGql(searchQuery: string = '') {
  const { chains } = useEnabledChains()

  const { data, error, isPending } = useSearchTokensQuery({
    input: {
      searchQuery,
      chainIds: chains,
      searchType: SearchType.TOKEN,
      page: 1,
      size: 8,
    },
    enabled: searchQuery !== '',
  })

  return useMemo(() => {
    const sortedTokens = data?.tokens?.map(mapSearchToken).filter(isExploreSupportedToken) ?? []
    return { data: sortedTokens, loading: isPending, error }
  }, [data?.tokens, error, isPending])
}
