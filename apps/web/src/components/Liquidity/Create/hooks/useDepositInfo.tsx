import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { useNativeTokenPercentageBufferExperiment } from 'components/Liquidity/Create/hooks/useNativeTokenPercentageBufferExperiment'
import { DepositInfo, DepositState } from 'components/Liquidity/types'
import {
  getDependentAmountFromV2Pair,
  getDependentAmountFromV3Position,
  getDependentAmountFromV4Position,
} from 'components/Liquidity/utils/getDependentAmount'
import { isInvalidRange, isOutOfRange } from 'components/Liquidity/utils/priceRangeInfo'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { PositionField } from 'types/position'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/useMaxAmountSpend'
import { applyNativeTokenPercentageBuffer } from 'uniswap/src/features/gas/utils'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'

export type UseDepositInfoProps = {
  protocolVersion: ProtocolVersion
  address?: string
  token0?: Maybe<Currency>
  token1?: Maybe<Currency>
  exactField: PositionField
  exactAmounts: {
    [field in PositionField]?: string
  }
  skipDependentAmount?: boolean
} & (
  | {
      protocolVersion: ProtocolVersion.V4
      pool?: V4Pool
      tickLower?: number
      tickUpper?: number
    }
  | {
      protocolVersion: ProtocolVersion.V3
      pool?: V3Pool
      tickLower?: number
      tickUpper?: number
    }
  | {
      protocolVersion: ProtocolVersion.V2
      pair?: Pair
    }
  | {
      protocolVersion: ProtocolVersion.UNSPECIFIED
    }
)

export function getDepositInfoProps({
  protocolVersion,
  address,
  displayCurrencies,
  ticks,
  poolOrPair,
  state,
}: {
  protocolVersion: ProtocolVersion
  address?: string
  displayCurrencies: {
    TOKEN0: Maybe<Currency>
    TOKEN1: Maybe<Currency>
  }
  ticks: [Maybe<number>, Maybe<number>]
  poolOrPair: V3Pool | V4Pool | Pair | undefined
  state: DepositState
}): UseDepositInfoProps {
  const { exactAmounts, exactField } = state

  if (protocolVersion === ProtocolVersion.V2) {
    return {
      protocolVersion,
      pair: poolOrPair as Pair,
      address,
      token0: displayCurrencies.TOKEN0,
      token1: displayCurrencies.TOKEN1,
      exactField,
      exactAmounts,
    } satisfies UseDepositInfoProps
  }

  const [tickLower, tickUpper] = ticks
  const invalidRange = isInvalidRange(tickLower, tickUpper)
  const outOfRange = isOutOfRange({
    poolOrPair,
    lowerTick: tickLower,
    upperTick: tickUpper,
  })

  if (protocolVersion === ProtocolVersion.V3) {
    return {
      protocolVersion,
      pool: poolOrPair as V3Pool,
      address,
      tickLower: tickLower ?? undefined,
      tickUpper: tickUpper ?? undefined,
      token0: displayCurrencies.TOKEN0,
      token1: displayCurrencies.TOKEN1,
      exactField,
      exactAmounts,
      skipDependentAmount: outOfRange || invalidRange,
    } satisfies UseDepositInfoProps
  }

  return {
    protocolVersion,
    pool: poolOrPair as V4Pool,
    address,
    tickLower: tickLower ?? undefined,
    tickUpper: tickUpper ?? undefined,
    token0: displayCurrencies.TOKEN0,
    token1: displayCurrencies.TOKEN1,
    exactField,
    exactAmounts,
    skipDependentAmount: outOfRange || invalidRange,
  } satisfies UseDepositInfoProps
}

export function useTokenBalanceWithBuffer(currencyBalance: Maybe<CurrencyAmount<Currency>>, bufferPercentage: number) {
  return useMemo(() => {
    if (!currencyBalance) {
      return undefined
    }

    return applyNativeTokenPercentageBuffer(currencyBalance, bufferPercentage)
  }, [currencyBalance, bufferPercentage])
}

export function useDepositInfo(state: UseDepositInfoProps): DepositInfo {
  const bufferPercentage = useNativeTokenPercentageBufferExperiment()
  const { protocolVersion, address, token0, token1, exactField, exactAmounts } = state

  const { balance: token0Balance } = useOnChainCurrencyBalance(token0, address)
  const { balance: token1Balance } = useOnChainCurrencyBalance(token1, address)

  const token0BalanceWithBuffer = useTokenBalanceWithBuffer(token0Balance, bufferPercentage)
  const token1BalanceWithBuffer = useTokenBalanceWithBuffer(token1Balance, bufferPercentage)

  const token0MaxAmount = useMaxAmountSpend({ currencyAmount: token0BalanceWithBuffer })
  const token1MaxAmount = useMaxAmountSpend({ currencyAmount: token1BalanceWithBuffer })

  const [independentToken, dependentToken] = exactField === PositionField.TOKEN0 ? [token0, token1] : [token1, token0]
  const independentAmount = tryParseCurrencyAmount(exactAmounts[exactField], independentToken)
  const otherAmount = tryParseCurrencyAmount(
    exactAmounts[exactField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0],
    dependentToken,
  )

  const dependentAmount: CurrencyAmount<Currency> | undefined | null = useMemo(() => {
    const shouldSkip = state.skipDependentAmount || protocolVersion === ProtocolVersion.UNSPECIFIED
    if (shouldSkip) {
      return dependentToken && CurrencyAmount.fromRawAmount(dependentToken, 0)
    }

    if (protocolVersion === ProtocolVersion.V2) {
      return getDependentAmountFromV2Pair({
        independentAmount,
        otherAmount,
        pair: state.pair,
        exactField,
        token0,
        token1,
        dependentToken,
      })
    }

    const { tickLower, tickUpper } = state
    if (tickLower === undefined || tickUpper === undefined || !state.pool || !independentAmount) {
      return undefined
    }

    const dependentTokenAmount =
      protocolVersion === ProtocolVersion.V3
        ? getDependentAmountFromV3Position({
            independentAmount,
            pool: state.pool,
            tickLower,
            tickUpper,
          })
        : getDependentAmountFromV4Position({
            independentAmount,
            pool: state.pool,
            tickLower,
            tickUpper,
          })
    return dependentToken && CurrencyAmount.fromRawAmount(dependentToken, dependentTokenAmount.quotient)
  }, [state, protocolVersion, independentAmount, otherAmount, dependentToken, exactField, token0, token1])

  const independentTokenUSDValue = useUSDCValue(independentAmount)
  const dependentTokenUSDValue = useUSDCValue(dependentAmount)

  const dependentField = exactField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0

  const parsedAmounts: { [field in PositionField]: CurrencyAmount<Currency> | undefined | null } = useMemo(() => {
    return {
      [PositionField.TOKEN0]: exactField === PositionField.TOKEN0 ? independentAmount : dependentAmount,
      [PositionField.TOKEN1]: exactField === PositionField.TOKEN0 ? dependentAmount : independentAmount,
    }
  }, [dependentAmount, independentAmount, exactField])
  const { [PositionField.TOKEN0]: currency0Amount, [PositionField.TOKEN1]: currency1Amount } = parsedAmounts

  const { t } = useTranslation()
  const error = useMemo(() => {
    if (!parsedAmounts[PositionField.TOKEN0] || !parsedAmounts[PositionField.TOKEN1]) {
      return t('common.noAmount.error')
    }

    const insufficientToken0Balance = currency0Amount && token0MaxAmount?.lessThan(currency0Amount)
    const insufficientToken1Balance = currency1Amount && token1MaxAmount?.lessThan(currency1Amount)

    if (insufficientToken0Balance && insufficientToken1Balance) {
      return <Trans i18nKey="common.insufficientBalance.error" />
    }

    if (insufficientToken0Balance) {
      return (
        <Trans
          i18nKey="common.insufficientTokenBalance.error"
          values={{
            tokenSymbol: token0?.symbol,
          }}
        />
      )
    }

    if (insufficientToken1Balance) {
      return (
        <Trans
          i18nKey="common.insufficientTokenBalance.error"
          values={{
            tokenSymbol: token1?.symbol,
          }}
        />
      )
    }

    return undefined
  }, [
    parsedAmounts,
    currency0Amount,
    token0MaxAmount,
    currency1Amount,
    token1MaxAmount,
    t,
    token0?.symbol,
    token1?.symbol,
  ])

  return useMemo(
    () => ({
      currencyBalances: { [PositionField.TOKEN0]: token0Balance, [PositionField.TOKEN1]: token1Balance },
      formattedAmounts: { [exactField]: exactAmounts[exactField], [dependentField]: dependentAmount?.toExact() },
      currencyAmounts: { [exactField]: independentAmount, [dependentField]: dependentAmount },
      currencyAmountsUSDValue: { [exactField]: independentTokenUSDValue, [dependentField]: dependentTokenUSDValue },
      error,
    }),
    [
      token0Balance,
      token1Balance,
      exactField,
      exactAmounts,
      dependentField,
      dependentAmount,
      independentAmount,
      independentTokenUSDValue,
      dependentTokenUSDValue,
      error,
    ],
  )
}
