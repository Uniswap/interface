import type { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { getCurrencyWithUnwrap } from '~/features/Liquidity/utils/currency'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { PositionField } from '~/types/position'

/**
 * The pair as the pool itself is presented, the Explore/PDP convention: a v2/v3 wrapped-native leg
 * reads as the native currency whichever form the deposit is funded from, and v4 legs read as served.
 * Derived from the sdk legs rather than `currencies.display`, so the range chart and its price controls
 * hold still when the deposit step's "Add as ETH" toggle flips a leg; the deposit form keeps following
 * `display`, which is what actually gets deposited.
 */
export function usePoolDisplayCurrencies(): { [field in PositionField]: Maybe<Currency> } {
  const { currencies, protocolVersion } = useCreateLiquidityContext()
  const { TOKEN0, TOKEN1 } = currencies.sdk

  return useMemo(
    () => ({
      [PositionField.TOKEN0]: getCurrencyWithUnwrap(TOKEN0, protocolVersion),
      [PositionField.TOKEN1]: getCurrencyWithUnwrap(TOKEN1, protocolVersion),
    }),
    [TOKEN0, TOKEN1, protocolVersion],
  )
}
