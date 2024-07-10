import { ApolloError } from '@apollo/client'
import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk-core'
import { useRef } from 'react'
import {
  Chain,
  ContractInput,
  SafetyLevel,
  TokenProjectsQuery,
  TokenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { CurrencyId } from 'uniswap/src/types/currency'
import {
  currencyId,
  currencyIdToChain,
  currencyIdToGraphQLAddress,
  isNativeCurrencyAddress,
} from 'uniswap/src/utils/currencyId'

type BuildCurrencyParams = {
  chainId?: Nullable<WalletChainId>
  address?: Nullable<string>
  decimals?: Nullable<number>
  symbol?: Nullable<string>
  name?: Nullable<string>
  bypassChecksum?: boolean
  buyFeeBps?: string
  sellFeeBps?: string
}

// Converts CurrencyId to ContractInput format for GQL token queries
export function currencyIdToContractInput(id: CurrencyId): ContractInput {
  return {
    chain: toGraphQLChain(currencyIdToChain(id) ?? UniverseChainId.Mainnet) ?? Chain.Ethereum,
    address: currencyIdToGraphQLAddress(id) ?? undefined,
  }
}

export function tokenProjectToCurrencyInfos(
  tokenProjects: TokenProjectsQuery['tokenProjects'],
  chainFilter?: WalletChainId | null,
): CurrencyInfo[] {
  return tokenProjects
    ?.flatMap((project) =>
      project?.tokens.map((token) => {
        const { logoUrl, safetyLevel, name } = project ?? {}
        const { chain, address, decimals, symbol } = token ?? {}
        const chainId = fromGraphQLChain(chain)

        if (chainFilter && chainFilter !== chainId) {
          return null
        }

        const currency = buildCurrency({
          chainId,
          address,
          decimals,
          symbol,
          name,
        })

        if (!currency) {
          return null
        }

        const currencyInfo: CurrencyInfo = {
          currency,
          currencyId: currencyId(currency),
          logoUrl,
          safetyLevel,
        }

        return currencyInfo
      }),
    )
    .filter(Boolean) as CurrencyInfo[]
}

// use inverse check here (instead of isNativeAddress) so we can typeguard address as must be string if this is true
function isNonNativeAddress(chainId: WalletChainId, address: Maybe<string>): address is string {
  return !isNativeCurrencyAddress(chainId, address)
}

/**
 * Creates a new instance of Token or NativeCurrency.
 *
 * @param params The parameters for building the currency.
 * @param params.chainId The ID of the chain where the token resides. If not provided, the function will return undefined.
 * @param params.address The token's address. If not provided, an instance of NativeCurrency is returned.
 * @param params.decimals The decimal count used by the token. If not provided, the function will return undefined.
 * @param params.symbol The token's symbol. This parameter is optional.
 * @param params.name The token's name. This parameter is optional.
 * @param params.bypassChecksum If true, bypasses the EIP-55 checksum on the token address. This parameter is optional and defaults to true.
 * @returns A new instance of Token or NativeCurrency if the parameters are valid, otherwise returns undefined.
 */
export function buildCurrency({
  chainId,
  address,
  decimals,
  symbol,
  name,
  bypassChecksum = true,
  buyFeeBps,
  sellFeeBps,
}: BuildCurrencyParams): Token | NativeCurrency | undefined {
  if (!chainId || decimals === undefined || decimals === null) {
    return undefined
  }

  const buyFee = buyFeeBps && BigNumber.from(buyFeeBps).gt(0) ? BigNumber.from(buyFeeBps) : undefined
  const sellFee = sellFeeBps && BigNumber.from(sellFeeBps).gt(0) ? BigNumber.from(sellFeeBps) : undefined

  return isNonNativeAddress(chainId, address)
    ? new Token(chainId, address, decimals, symbol ?? undefined, name ?? undefined, bypassChecksum, buyFee, sellFee)
    : NativeCurrency.onChain(chainId)
}

export function gqlTokenToCurrencyInfo(token: NonNullable<NonNullable<TokenQuery['token']>>): CurrencyInfo | null {
  const { chain, address, decimals, symbol, project, feeData } = token
  const chainId = fromGraphQLChain(chain)

  const currency = buildCurrency({
    chainId,
    address,
    decimals,
    symbol,
    name: project?.name,
    buyFeeBps: feeData?.buyFeeBps,
    sellFeeBps: feeData?.sellFeeBps,
  })

  if (!currency) {
    return null
  }

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
  const persistedErrorRef = useRef<ApolloError>()

  if (error || !loading) {
    persistedErrorRef.current = error
  }

  return persistedErrorRef.current
}
