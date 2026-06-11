import { useQuery } from '@tanstack/react-query'
import {
  CreateClassicPositionRequest,
  CreateClassicPositionResponse,
  CreatePositionRequest,
  IncreasePositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useEffect, useMemo, useState } from 'react'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { useCreatePositionQuery } from 'uniswap/src/data/apiClients/liquidityService/useCreatePositionQuery'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { DepositInfo } from '~/types/liquidity'
import { PositionField } from '~/types/position'

export function useIncreasePositionDependentAmountFallback({
  queryParams,
  isQueryEnabled,
  exactField,
}: {
  queryParams: IncreasePositionRequest | undefined
  isQueryEnabled: boolean
  exactField: PositionField
}) {
  const [hasErrorResponse, setHasErrorResponse] = useState(false)

  const fallbackParams = useMemo(() => {
    if (!queryParams) {
      return undefined
    }

    return new IncreasePositionRequest({
      // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
      ...queryParams,
      simulateTransaction: false,
    })
  }, [queryParams])

  const hasSimulateTransaction = Boolean(queryParams?.simulateTransaction)

  const { data: increaseCalldata, error: calldataError } = useQuery(
    liquidityQueries.increasePosition({
      params: fallbackParams,
      staleTime: 5 * ONE_SECOND_MS,
      enabled: isQueryEnabled && hasSimulateTransaction && !hasErrorResponse,
      refetchInterval: hasErrorResponse ? false : 5 * ONE_SECOND_MS,
      retry: false,
    }),
  )

  useEffect(() => {
    setHasErrorResponse(!!calldataError)
  }, [calldataError, queryParams])

  const dependentToken = exactField === PositionField.TOKEN0 ? increaseCalldata?.token1 : increaseCalldata?.token0
  return dependentToken?.amount
}

export function useCreatePositionDependentAmountFallback({
  queryParams,
  isQueryEnabled,
  exactField,
}: {
  queryParams: CreateClassicPositionRequest | CreatePositionRequest | undefined
  isQueryEnabled: boolean
  exactField: PositionField
}) {
  const fallbackParams = useMemo(() => {
    if (!queryParams) {
      return undefined
    }

    if (queryParams instanceof CreatePositionRequest) {
      return new CreatePositionRequest({
        // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
        ...queryParams,
        simulateTransaction: false,
      })
    }

    return new CreateClassicPositionRequest({
      // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
      ...queryParams,
      simulateTransaction: false,
    })
  }, [queryParams])

  const [hasErrorResponse, setHasErrorResponse] = useState(false)

  const hasSimulateTransaction = Boolean(queryParams?.simulateTransaction)

  const { createCalldata, createError } = useCreatePositionQuery({
    createCalldataQueryParams: fallbackParams,
    transactionError: hasErrorResponse,
    isQueryEnabled: isQueryEnabled && hasSimulateTransaction,
  })

  useEffect(() => {
    setHasErrorResponse(!!createError)
  }, [createError, queryParams])

  if (createCalldata instanceof CreateClassicPositionResponse) {
    return createCalldata.dependentToken?.amount
  }

  return exactField === PositionField.TOKEN0 ? createCalldata?.token1?.amount : createCalldata?.token0?.amount
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
