import { ApolloError } from '@apollo/client'
import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk-core'
import { useRef } from 'react'
import {
  Chain,
  ContractInput,
  ProtectionAttackType,
  ProtectionResult,
  SafetyLevel,
  TokenProjectsQuery,
  TokenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { AttackType, CurrencyInfo, PortfolioBalance, SafetyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { CurrencyId } from 'uniswap/src/types/currency'
import {
  currencyId,
  currencyIdToChain,
  currencyIdToGraphQLAddress,
  isNativeCurrencyAddress,
} from 'uniswap/src/utils/currencyId'
import { sortKeysRecursively } from 'utilities/src/primitives/objects'

type BuildCurrencyParams = {
  chainId?: Nullable<UniverseChainId>
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
    // TODO: WALL-4919: Remove hardcoded Mainnet
    chain: toGraphQLChain(currencyIdToChain(id) ?? UniverseChainId.Mainnet) ?? Chain.Ethereum,
    address: currencyIdToGraphQLAddress(id) ?? undefined,
  }
}

export function tokenProjectToCurrencyInfos(
  tokenProjects: TokenProjectsQuery['tokenProjects'],
  chainFilter?: UniverseChainId | null,
): CurrencyInfo[] {
  return tokenProjects
    ?.flatMap((project) =>
      project?.tokens.map((token) => {
        const { logoUrl, safetyLevel } = project ?? {}
        const { name, chain, address, decimals, symbol, feeData, protectionInfo } = token ?? {}
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
          buyFeeBps: feeData?.buyFeeBps,
          sellFeeBps: feeData?.sellFeeBps,
        })

        if (!currency) {
          return null
        }

        const currencyInfo = buildCurrencyInfo({
          currency,
          currencyId: currencyId(currency),
          logoUrl,
          safetyInfo: getCurrencySafetyInfo(safetyLevel, protectionInfo),
        })

        return currencyInfo
      }),
    )
    .filter(Boolean) as CurrencyInfo[]
}

// use inverse check here (instead of isNativeAddress) so we can typeguard address as must be string if this is true
function isNonNativeAddress(chainId: UniverseChainId, address: Maybe<string>): address is string {
  return !isNativeCurrencyAddress(chainId, address)
}

const CURRENCY_CACHE = new Map<string, Token | NativeCurrency>()

/**
 * Creates a new instance of Token or NativeCurrency, or returns an existing copy if one was already created.
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
export function buildCurrency(args: BuildCurrencyParams): Token | NativeCurrency | undefined {
  const { chainId, address, decimals, symbol, name, bypassChecksum = true, buyFeeBps, sellFeeBps } = args

  if (!chainId || decimals === undefined || decimals === null) {
    return undefined
  }

  const cacheKey = JSON.stringify(sortKeysRecursively(args))

  const cachedCurrency = CURRENCY_CACHE.get(cacheKey)

  if (cachedCurrency) {
    // This allows us to better memoize components that use a `Currency` as a dependency.
    return cachedCurrency
  }

  const buyFee = buyFeeBps && BigNumber.from(buyFeeBps).gt(0) ? BigNumber.from(buyFeeBps) : undefined
  const sellFee = sellFeeBps && BigNumber.from(sellFeeBps).gt(0) ? BigNumber.from(sellFeeBps) : undefined

  const result = isNonNativeAddress(chainId, address)
    ? new Token(chainId, address, decimals, symbol ?? undefined, name ?? undefined, bypassChecksum, buyFee, sellFee)
    : NativeCurrency.onChain(chainId)

  CURRENCY_CACHE.set(cacheKey, result)
  return result
}

const CURRENCY_INFO_CACHE = new Map<string, CurrencyInfo>()

export function buildCurrencyInfo(args: CurrencyInfo): CurrencyInfo {
  const cacheKey = JSON.stringify(sortKeysRecursively(args))

  const cachedCurrencyInfo = CURRENCY_INFO_CACHE.get(cacheKey)

  if (cachedCurrencyInfo) {
    // This allows us to better memoize components that use a `CurrencyInfo` as a dependency.
    return cachedCurrencyInfo
  }

  CURRENCY_INFO_CACHE.set(cacheKey, args)
  return args
}

function getTokenListFromSafetyLevel(safetyInfo?: SafetyLevel): TokenList {
  switch (safetyInfo) {
    case SafetyLevel.Blocked:
      return TokenList.Blocked
    case SafetyLevel.Verified:
      return TokenList.Default
    default:
      return TokenList.NonDefault
  }
}

// Priority based on Token Protection PRD spec
function getHighestPriorityAttackType(attackTypes?: (ProtectionAttackType | undefined)[]): AttackType | undefined {
  if (!attackTypes || attackTypes.length === 0) {
    return undefined
  }
  const attackTypeSet = new Set(attackTypes)
  if (attackTypeSet.has(ProtectionAttackType.Impersonator)) {
    return AttackType.Impersonator
  } else if (attackTypeSet.has(ProtectionAttackType.AirdropPattern)) {
    return AttackType.Airdrop
  } else if (attackTypeSet.has(ProtectionAttackType.HighFees)) {
    return AttackType.HighFees
  } else {
    return AttackType.Other
  }
}

export function getCurrencySafetyInfo(
  safetyLevel?: SafetyLevel,
  protectionInfo?: NonNullable<TokenQuery['token']>['protectionInfo'],
): SafetyInfo {
  return {
    tokenList: getTokenListFromSafetyLevel(safetyLevel),
    attackType: getHighestPriorityAttackType(protectionInfo?.attackTypes),
    protectionResult: protectionInfo?.result ?? ProtectionResult.Unknown,
    blockaidFees: protectionInfo?.blockaidFees
      ? {
          buyFeePercent: protectionInfo.blockaidFees.buy ? protectionInfo.blockaidFees.buy * 100 : undefined,
          sellFeePercent: protectionInfo.blockaidFees.sell ? protectionInfo.blockaidFees.sell * 100 : undefined,
        }
      : undefined,
  }
}

export function gqlTokenToCurrencyInfo(
  token: Omit<NonNullable<NonNullable<TokenQuery['token']>>, 'project'> & {
    project?: Omit<NonNullable<NonNullable<TokenQuery['token']>['project']>, 'tokens'>
  },
): CurrencyInfo | null {
  const { name, chain, address, decimals, symbol, project, feeData, protectionInfo } = token
  const chainId = fromGraphQLChain(chain)

  const currency = buildCurrency({
    chainId,
    address,
    decimals,
    symbol,
    name,
    buyFeeBps: feeData?.buyFeeBps,
    sellFeeBps: feeData?.sellFeeBps,
  })

  if (!currency) {
    return null
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: project?.logoUrl,
    safetyInfo: getCurrencySafetyInfo(project?.safetyLevel, protectionInfo),
    // defaulting to not spam. currently this flow triggers when a user is searching
    // for a token, in which case the user probably doesn't expect the token to be spam
    isSpam: project?.isSpam ?? false,
  })
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

export function sortByName(unsortedBalances?: PortfolioBalance[]): PortfolioBalance[] {
  if (!unsortedBalances) {
    return []
  }

  return unsortedBalances.sort((a, b) => {
    if (!a.currencyInfo.currency.name) {
      return 1
    }
    if (!b.currencyInfo.currency.name) {
      return -1
    }
    return a.currencyInfo.currency.name?.localeCompare(b.currencyInfo.currency.name)
  })
}
