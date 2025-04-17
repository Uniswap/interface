import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { DepositInfo } from 'components/Liquidity/types'
import { useEffect, useMemo, useState } from 'react'
import { PositionField } from 'types/position'
import { useCreateLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useCreateLpPositionCalldataQuery'
import { useIncreaseLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useIncreaseLpPositionCalldataQuery'
import { CreateLPPositionRequest, IncreaseLPPositionRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function useIncreasePositionDependentAmountFallback(
  queryParams: IncreaseLPPositionRequest | undefined,
  isQueryEnabled: boolean,
) {
  const [hasErrorResponse, setHasErrorResponse] = useState(false)

  const { data, error } = useIncreaseLpPositionCalldataQuery({
    params: {
      ...queryParams,
      simulateTransaction: false,
    },
    refetchInterval: hasErrorResponse ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled: isQueryEnabled && queryParams?.simulateTransaction,
  })

  useEffect(() => {
    setHasErrorResponse(!!error)
  }, [error, queryParams])

  return data?.dependentAmount
}

export function useCreatePositionDependentAmountFallback(
  queryParams: CreateLPPositionRequest | undefined,
  isQueryEnabled: boolean,
) {
  const [hasErrorResponse, setHasErrorResponse] = useState(false)

  const { data, error } = useCreateLpPositionCalldataQuery({
    params: {
      ...queryParams,
      simulateTransaction: false,
    },
    refetchInterval: hasErrorResponse ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled: isQueryEnabled && queryParams?.simulateTransaction,
  })

  useEffect(() => {
    setHasErrorResponse(!!error)
  }, [error, queryParams])

  return data?.dependentAmount
}

export function useUpdatedAmountsFromDependentAmount({
  token0,
  token1,
  dependentAmount,
  exactField,
  currencyAmounts,
  currencyAmountsUSDValue,
  formattedAmounts,
  deposit0Disabled,
  deposit1Disabled,
}: {
  token0?: Currency
  token1?: Currency
  dependentAmount?: string
  exactField: PositionField
  deposit0Disabled: boolean
  deposit1Disabled: boolean
} & Pick<DepositInfo, 'currencyAmounts' | 'currencyAmountsUSDValue' | 'formattedAmounts'>): {
  updatedFormattedAmounts?: { [field in PositionField]?: string }
  updatedUSDAmounts?: { [field in PositionField]?: CurrencyAmount<Currency> }
  updatedCurrencyAmounts?: { [field in PositionField]?: CurrencyAmount<Currency> }
  updatedDeposit0Disabled: boolean
  updatedDeposit1Disabled: boolean
} {
  const dependentAmount0 =
    dependentAmount && exactField === PositionField.TOKEN1 && token0
      ? CurrencyAmount.fromRawAmount(token0, dependentAmount)
      : undefined
  const dependentAmount0USDValue = useUSDCValue(dependentAmount0) ?? undefined

  const dependentAmount1 =
    dependentAmount && exactField === PositionField.TOKEN0 && token1
      ? CurrencyAmount.fromRawAmount(token1, dependentAmount)
      : undefined
  const dependentAmount1USDValue = useUSDCValue(dependentAmount1) ?? undefined

  return useMemo(() => {
    if (dependentAmount0) {
      return {
        updatedFormattedAmounts: {
          ...formattedAmounts,
          TOKEN0: dependentAmount0?.toExact() ?? formattedAmounts?.TOKEN0,
        },
        updatedUSDAmounts: {
          ...currencyAmountsUSDValue,
          TOKEN0: dependentAmount0USDValue,
        },
        updatedCurrencyAmounts: {
          ...currencyAmounts,
          TOKEN0: dependentAmount0 ?? currencyAmounts?.TOKEN0,
        },
        updatedDeposit0Disabled: !dependentAmount0.greaterThan(0),
        updatedDeposit1Disabled: deposit1Disabled,
      }
    } else if (dependentAmount1) {
      return {
        updatedFormattedAmounts: {
          ...formattedAmounts,
          TOKEN1: dependentAmount1?.toExact() ?? formattedAmounts?.TOKEN1,
        },
        updatedUSDAmounts: {
          ...currencyAmountsUSDValue,
          TOKEN1: dependentAmount1USDValue,
        },
        updatedCurrencyAmounts: {
          ...currencyAmounts,
          TOKEN1: dependentAmount1 ?? currencyAmounts?.TOKEN1,
        },
        updatedDeposit0Disabled: deposit0Disabled,
        updatedDeposit1Disabled: !dependentAmount1.greaterThan(0),
      }
    }
    return {
      updatedFormattedAmounts: formattedAmounts,
      updatedUSDAmounts: currencyAmountsUSDValue,
      updatedCurrencyAmounts: currencyAmounts,
      updatedDeposit0Disabled: deposit0Disabled,
      updatedDeposit1Disabled: deposit1Disabled,
    }
  }, [
    dependentAmount0,
    dependentAmount0USDValue,
    dependentAmount1,
    dependentAmount1USDValue,
    currencyAmounts,
    currencyAmountsUSDValue,
    formattedAmounts,
    deposit0Disabled,
    deposit1Disabled,
  ])
}
