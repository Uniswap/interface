import type { UniverseChainId } from '@universe/chains'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { currencyId as toCurrencyId } from 'uniswap/src/utils/currencyId'
import type { TokenHoverCardToken } from '~/components/HoverCard/TokenHoverCard/types'
import { tokenStatToCurrency, unwrapToken } from '~/data/util'

export type TokenIdentity = {
  chainId: UniverseChainId
  currencyIdFromToken?: string
  rawAddress?: string
}

/** Resolves the identity fields the card needs from whichever of `token`/`currencyInfo` was provided. */
export function deriveTokenIdentity({
  token,
  currencyInfoProp,
  defaultChainId,
}: {
  token?: TokenHoverCardToken
  currencyInfoProp?: CurrencyInfo
  defaultChainId: UniverseChainId
}): TokenIdentity {
  if (!token) {
    const chainId = currencyInfoProp?.currency.chainId ?? defaultChainId
    return {
      chainId,
      currencyIdFromToken: undefined,
      rawAddress: currencyInfoProp?.currency.isToken ? currencyInfoProp.currency.address : undefined,
    }
  }

  const { chainId } = token
  const unwrappedToken = unwrapToken(chainId, token)
  const currency = tokenStatToCurrency(unwrappedToken)
  return {
    chainId,
    currencyIdFromToken: currency ? toCurrencyId(currency) : undefined,
    rawAddress: unwrappedToken.address,
  }
}
