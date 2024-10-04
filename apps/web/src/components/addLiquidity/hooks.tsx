import { AddLiquidityInfo, AddLiquidityState } from 'components/addLiquidity/AddLiquidityContext'
import { Field } from 'components/addLiquidity/InputForm'
import { useAccount } from 'hooks/useAccount'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'

export function useDerivedAddLiquidityInfo(state: AddLiquidityState): AddLiquidityInfo {
  const account = useAccount()
  const { position, exactAmount } = state

  if (!position) {
    throw new Error('no position available')
  }

  const token0 = position.currency0Amount.currency
  const token1 = position.currency1Amount.currency

  const [token0Balance, token1Balance] = useCurrencyBalances(account.address, [token0, token1])
  const token0CurrencyAmount = tryParseCurrencyAmount(exactAmount, token0)
  const token0USDValue = useUSDCValue(token0CurrencyAmount) || undefined

  // TODO: compute the dependent value

  return {
    formattedAmounts: { [Field.TOKEN0]: exactAmount },
    currencyBalances: { [Field.TOKEN0]: token0Balance, [Field.TOKEN1]: token1Balance },
    currencyAmounts: { [Field.TOKEN0]: token0CurrencyAmount },
    currencyAmountsUSDValue: { [Field.TOKEN0]: token0USDValue },
  }
}
