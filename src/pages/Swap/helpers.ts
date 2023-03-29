/* eslint-disable import/no-unused-modules */
import { Currency, Token } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { TEVMOS_STABLE_COINS, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'

export function getQueryToken(currency0: Currency | null, currency1: Currency | null): Token | null {
  const token0 = currency0 as Token
  const token1 = currency1 as Token

  if (currency0 === null && currency1 !== null) {
    return currency1 as Token
  }
  if (currency1 === null) {
    return WRAPPED_NATIVE_CURRENCY[SupportedChainId.TESTNET] ?? null
  }
  if (
    (token1?.address === undefined ||
      token1?.address?.toLowerCase() === WRAPPED_NATIVE_CURRENCY[SupportedChainId.TESTNET]?.address?.toLowerCase()) &&
    !TEVMOS_STABLE_COINS.includes(token0?.address?.toLowerCase() ?? '')
  ) {
    return currency0 as Token
  }

  if (TEVMOS_STABLE_COINS.includes(token1?.address?.toLowerCase() ?? '')) {
    if (TEVMOS_STABLE_COINS.includes(token0?.address?.toLowerCase() ?? '')) {
      return currency1 as Token
    } else {
      return currency0 as Token
    }
  } else {
    return currency1 as Token
  }
}
