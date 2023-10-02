import { ApolloError } from '@apollo/client'
import { Token } from '@uniswap/sdk-core'
import { useEffect, useState } from 'react'
import { ChainId } from 'wallet/src/constants/chains'
import {
  Chain,
  ContractInput,
  SafetyLevel,
  TokenProjectsQuery,
  TopTokensQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { fromGraphQLChain, toGraphQLChain } from 'wallet/src/features/chains/utils'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import {
  currencyId,
  CurrencyId,
  currencyIdToChain,
  currencyIdToGraphQLAddress,
  isNativeCurrencyAddress,
} from 'wallet/src/utils/currencyId'
import { CurrencyInfo } from './types'

// Converts CurrencyId to ContractInput format for GQL token queries
export function currencyIdToContractInput(id: CurrencyId): ContractInput {
  return {
    chain: toGraphQLChain(currencyIdToChain(id) ?? ChainId.Mainnet) ?? Chain.Ethereum,
    address: currencyIdToGraphQLAddress(id),
  }
}

export function tokenProjectToCurrencyInfos(
  tokenProject: TokenProjectsQuery['tokenProjects'],
  chainFilter?: ChainId | null
): CurrencyInfo[] {
  return tokenProject
    ?.flatMap((project) =>
      project?.tokens.map((token) => {
        const { logoUrl, safetyLevel, name } = project ?? {}
        const { chain, address, decimals, symbol } = token ?? {}
        const chainId = fromGraphQLChain(chain)
        if (!chainId || !decimals || !symbol) return null

        if (chainFilter && chainFilter !== chainId) return null
        const currency = isNonNativeAddress(chainId, address)
          ? new Token(
              chainId,
              address,
              decimals,
              symbol,
              name ?? undefined,
              /* bypassChecksum:*/ true
            )
          : NativeCurrency.onChain(chainId)

        const currencyInfo: CurrencyInfo = {
          currency,
          currencyId: currencyId(currency),
          logoUrl,
          safetyLevel,
        }

        return currencyInfo
      })
    )
    .filter(Boolean) as CurrencyInfo[]
}

// use inverse check here (instead of isNativeAddress) so we can typeguard address as must be string if this is true
function isNonNativeAddress(chainId: ChainId, address: Maybe<string>): address is string {
  return !isNativeCurrencyAddress(chainId, address)
}

export function gqlTokenToCurrencyInfo(
  token: NonNullable<NonNullable<TopTokensQuery['topTokens']>[0]>,
  chainFilter?: ChainId | null
): CurrencyInfo | null {
  const { chain, address, decimals, symbol, project } = token
  const chainId = fromGraphQLChain(chain)

  if (!chainId || decimals == null) return null
  if (chainFilter && chainFilter !== chainId) return null

  const currency = isNonNativeAddress(chainId, address)
    ? new Token(
        chainId,
        address,
        decimals,
        symbol ?? undefined,
        project?.name ?? undefined,
        /* bypassChecksum:*/ true
      )
    : NativeCurrency.onChain(chainId)

  const currencyInfo: CurrencyInfo = {
    currency,
    currencyId: currencyId(currency),
    logoUrl: project?.logoUrl,
    safetyLevel: project?.safetyLevel ?? SafetyLevel.StrongWarning,
    // defaulting to not spam. currently this flow triggers when a user is searching
    // for a token, in which case the user probably doesn't expect the token to be spam
    isSpam: project?.isSpam ?? false,
  }
  return currencyInfo
}

/*
Apollo client clears errors when repolling, so if there's an error and we have a
polling interval defined for the endpoint, then `error` will flicker between
being defined and not defined. This hook helps persist returned errors when polling
until the network request returns.

Feature request to enable persisted errors: https://github.com/apollographql/apollo-feature-requests/issues/348
*/
export function usePersistedError(loading: boolean, error?: ApolloError): ApolloError | undefined {
  const [persistedError, setPersistedError] = useState<ApolloError>()

  useEffect(() => {
    if (error || !loading) {
      setPersistedError(error)
      return
    }
  }, [error, loading, setPersistedError])

  return persistedError
}
