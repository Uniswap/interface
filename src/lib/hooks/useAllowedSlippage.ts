import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useAtomValue } from 'jotai/utils'
import { autoSlippageAtom, maxSlippageAtom } from 'lib/state/settings'
import { InterfaceTrade } from 'state/routing/types'

export function toPercent(maxSlippage: number | undefined): Percent | undefined {
  if (!maxSlippage) return undefined
  const numerator = Math.floor(maxSlippage * 100)
  return new Percent(numerator, 10_000)
}

/** Returns the user-inputted max slippage. */
export default function useMaxSlippage(trade: InterfaceTrade<Currency, Currency, TradeType> | undefined): Percent {
  const autoSlippage = useAutoSlippageTolerance(trade)
  const maxSlippage = toPercent(useAtomValue(maxSlippageAtom))
  return useAtomValue(autoSlippageAtom) ? autoSlippage : maxSlippage ?? autoSlippage
}
