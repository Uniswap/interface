import type { Currency } from '@uniswap/sdk-core'
import { type ReactNode, useCallback, useMemo } from 'react'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getWrappedTokenIfExists } from 'uniswap/src/utils/currency'
import { areCurrenciesEqual } from 'uniswap/src/utils/currencyId'
import { UnwrapNativeCurrencyToggle } from '~/features/Liquidity/UnwrapNativeCurrencyToggle'
import { canUnwrapCurrency } from '~/features/Liquidity/utils/currency'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { PositionField } from '~/types/position'

/**
 * The create flow's "Add as ETH" toggles, one per deposit leg, for the deposit form's under-card slots.
 * Only a v2/v3 leg the pool holds as the chain's wrapped-native token gets one; every other leg is
 * `undefined`. The toggle reflects and rewrites the leg's form in `currencyInputs`, so it needs no state
 * of its own and the choice persists for as long as the flow is mounted.
 */
export function useUnwrapNativeCurrencyToggles(): { [field in PositionField]?: ReactNode } {
  const { currencies, protocolVersion, setCurrencyInputs } = useCreateLiquidityContext()

  const setLegCurrency = useCallback(
    (wrappedLeg: Currency, next: Currency) => {
      // Swap only the input behind this leg. The pool is keyed on the wrapped token either way, so the
      // pool, range and typed amounts (native and wrapped share decimals) all carry over.
      const isThisLeg = (input: Maybe<Currency>): boolean =>
        areCurrenciesEqual(getWrappedTokenIfExists(input), wrappedLeg)
      setCurrencyInputs((prev) => ({
        tokenA: isThisLeg(prev.tokenA) ? next : prev.tokenA,
        tokenB: isThisLeg(prev.tokenB) ? next : prev.tokenB,
      }))
    },
    [setCurrencyInputs],
  )

  return useMemo(() => {
    const buildToggle = (field: PositionField): ReactNode => {
      const wrappedLeg = currencies.sdk[field]
      const selected = currencies.display[field]
      if (!wrappedLeg || !selected || !canUnwrapCurrency(wrappedLeg, protocolVersion)) {
        return undefined
      }
      const nativeCurrency = nativeOnChain(wrappedLeg.chainId)
      return (
        <UnwrapNativeCurrencyToggle
          nativeCurrency={nativeCurrency}
          checked={selected.isNative}
          onCheckedChange={() => setLegCurrency(wrappedLeg, selected.isNative ? wrappedLeg : nativeCurrency)}
        />
      )
    }
    return {
      [PositionField.TOKEN0]: buildToggle(PositionField.TOKEN0),
      [PositionField.TOKEN1]: buildToggle(PositionField.TOKEN1),
    }
  }, [currencies.display, currencies.sdk, protocolVersion, setLegCurrency])
}
