import type { PlainMessage } from '@bufbuild/protobuf'
import type { Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { fractionToBpsString, getV2CurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'

/**
 * Converts a V2 REST `data.v2.Token` (from GetToken/GetTokens) into a CurrencyInfo. V2 is the
 * canonical metadata shape going forward — gqlTokenToCurrencyInfo (the GraphQL/legacy path) is
 * what will eventually need to adapt onto V2's model, not the reverse. In the meantime, safety
 * data is mapped into the still-GraphQL-shaped SafetyInfo type via getV2CurrencySafetyInfo (see
 * that function's comment) since SafetyInfo itself hasn't been migrated to a V2-native shape yet.
 *
 * Known fidelity gap vs gqlTokenToCurrencyInfo: no bridging info in the V2 schema
 * (isBridged/bridgedWithdrawalInfo always unset) and no `spamCode` equivalent.
 *
 * `projectId` is sourced from `token.multichain?.id` rather than a V2 `project.id` field
 * (V2's TokenProject has no `id`). This matches how `projectId` is actually used downstream —
 * cross-chain "same asset" grouping (search history multichain grouping, same-asset-bridge
 * detection in swap) — which is precisely what `TokenMultichain.id` represents, and is the
 * same identifier TDP already uses for multichain aggregation.
 */
export function restV2TokenToCurrencyInfo(token: PlainMessage<Token>): CurrencyInfo | undefined {
  const { chainId, address, decimals, symbol, name, project, safety, fees, multichain } = token

  const currency = buildCurrency({
    chainId: chainId as UniverseChainId,
    address,
    decimals,
    symbol,
    name,
    buyFeeBps: fractionToBpsString(fees?.buyFee),
    sellFeeBps: fractionToBpsString(fees?.sellFee),
  })

  if (!currency) {
    return undefined
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: project?.logoUrl,
    safetyInfo: getV2CurrencySafetyInfo(safety, fees),
    // defaulting to not spam. currently this flow triggers when a user is searching
    // for a token, in which case the user probably doesn't expect the token to be spam
    isSpam: safety?.isSpam ?? false,
    isBridged: false,
    bridgedWithdrawalInfo: undefined,
    projectId: multichain?.id,
  })
}
