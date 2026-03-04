import { useQuery } from '@tanstack/react-query'
import {
  CreateLPPositionRequest,
  IncreaseLPPositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import {
  V2CreateLPPosition,
  V3CreateLPPosition,
  V4CreateLPPosition,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useEffect, useMemo, useState } from 'react'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { DepositInfo } from '~/components/Liquidity/types'
import { PositionField } from '~/types/position'

export function useIncreasePositionDependentAmountFallback(
  queryParams: IncreaseLPPositionRequest | undefined,
  isQueryEnabled: boolean,
) {
  const [hasErrorResponse, setHasErrorResponse] = useState(false)

  const liquidityIncreaseParams = useMemo(() => {
    if (!queryParams) {
      return undefined
    }

    const { increaseLpPosition } = queryParams
    const updatedIncreaseLpPosition =
      increaseLpPosition.case === 'v4IncreaseLpPosition'
        ? { case: 'v4IncreaseLpPosition' as const, value: { ...increaseLpPosition.value, simulateTransaction: false } }
        : increaseLpPosition.case === 'v3IncreaseLpPosition'
          ? {
              case: 'v3IncreaseLpPosition' as const,
              value: { ...increaseLpPosition.value, simulateTransaction: false },
            }
          : increaseLpPosition.case === 'v2IncreaseLpPosition'
            ? {
                case: 'v2IncreaseLpPosition' as const,
                value: { ...increaseLpPosition.value, simulateTransaction: false },
              }
            : increaseLpPosition
    return new IncreaseLPPositionRequest({ increaseLpPosition: updatedIncreaseLpPosition })
  }, [queryParams])

  const { data, error } = useQuery(
    liquidityQueries.increasePosition({
      params: liquidityIncreaseParams,
      refetchInterval: hasErrorResponse ? false : 5 * ONE_SECOND_MS,
      retry: false,
      enabled: isQueryEnabled && queryParams?.increaseLpPosition.value?.simulateTransaction,
    }),
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: +queryParams
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

  const liquidityCreateParams = useMemo(() => {
    if (!queryParams) {
      return undefined
    }
    const { createLpPosition } = queryParams

    if (createLpPosition.case === 'v4CreateLpPosition') {
      return new CreateLPPositionRequest({
        createLpPosition: {
          case: 'v4CreateLpPosition',
          value: new V4CreateLPPosition({
            ...createLpPosition.value,
            simulateTransaction: false,
          }),
        },
      })
    }

    if (createLpPosition.case === 'v3CreateLpPosition') {
      return new CreateLPPositionRequest({
        createLpPosition: {
          case: 'v3CreateLpPosition',
          value: new V3CreateLPPosition({
            ...createLpPosition.value,
            simulateTransaction: false,
          }),
        },
      })
    }

    if (createLpPosition.case === 'v2CreateLpPosition') {
      return new CreateLPPositionRequest({
        createLpPosition: {
          case: 'v2CreateLpPosition',
          value: new V2CreateLPPosition({
            ...createLpPosition.value,
            simulateTransaction: false,
          }),
        },
      })
    }

    return new CreateLPPositionRequest({ createLpPosition })
  }, [queryParams])

  const { data, error } = useQuery(
    liquidityQueries.createPosition({
      params: liquidityCreateParams,
      refetchInterval: hasErrorResponse ? false : 5 * ONE_SECOND_MS,
      retry: false,
      enabled: isQueryEnabled && Boolean(queryParams?.createLpPosition.value?.simulateTransaction),
    }),
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: +queryParams
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
  token0: Maybe<Currency>
  token1: Maybe<Currency>
  dependentAmount?: string
  exactField: PositionField
  deposit0Disabled?: boolean
  deposit1Disabled?: boolean
} & Pick<DepositInfo, 'currencyAmounts' | 'currencyAmountsUSDValue' | 'formattedAmounts'>): {
  updatedFormattedAmounts?: { [field in PositionField]?: string }
  updatedUSDAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  updatedCurrencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  updatedDeposit0Disabled?: boolean
  updatedDeposit1Disabled?: boolean
} {
  const dependentAmount0 =
    dependentAmount && exactField === PositionField.TOKEN1 && token0
      ? CurrencyAmount.fromRawAmount(token0, dependentAmount)
      : undefined
  const dependentAmount0USDValue = useUSDCValue(dependentAmount0)

  const dependentAmount1 =
    dependentAmount && exactField === PositionField.TOKEN0 && token1
      ? CurrencyAmount.fromRawAmount(token1, dependentAmount)
      : undefined
  const dependentAmount1USDValue = useUSDCValue(dependentAmount1)

  return useMemo(() => {
    if (dependentAmount0) {
      return {
        updatedFormattedAmounts: {
          ...formattedAmounts,
          TOKEN0: dependentAmount0.toExact(),
        },
        updatedUSDAmounts: {
          ...currencyAmountsUSDValue,
          TOKEN0: dependentAmount0USDValue,
        },
        updatedCurrencyAmounts: {
          ...currencyAmounts,
          TOKEN0: dependentAmount0,
        },
        updatedDeposit0Disabled: !dependentAmount0.greaterThan(0),
        updatedDeposit1Disabled: deposit1Disabled,
      }
    } else if (dependentAmount1) {
      return {
        updatedFormattedAmounts: {
          ...formattedAmounts,
          TOKEN1: dependentAmount1.toExact(),
        },
        updatedUSDAmounts: {
          ...currencyAmountsUSDValue,
          TOKEN1: dependentAmount1USDValue,
        },
        updatedCurrencyAmounts: {
          ...currencyAmounts,
          TOKEN1: dependentAmount1,
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
