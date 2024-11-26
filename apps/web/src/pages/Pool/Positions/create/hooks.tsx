// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { DepositInfo, DepositState } from 'components/Liquidity/types'
import { getPoolFromRest } from 'components/Liquidity/utils'
import { ConnectWalletButtonText } from 'components/NavBar/accountCTAsExperimentUtils'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useIsPoolOutOfSync } from 'hooks/useIsPoolOutOfSync'
import { useSwapTaxes } from 'hooks/useSwapTaxes'
import { PairState, useV2Pair } from 'hooks/useV2Pairs'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import {
  CreatePositionInfo,
  CreateV2PositionInfo,
  CreateV3PositionInfo,
  CreateV4PositionInfo,
  OptionalCurrency,
  PositionState,
  PriceRangeInfo,
  PriceRangeState,
} from 'pages/Pool/Positions/create/types'
import {
  getCurrencyAddressWithWrap,
  getCurrencyWithWrap,
  getDependentAmountFromV2Pair,
  getDependentAmountFromV3Position,
  getDependentAmountFromV4Position,
  getPairFromPositionStateAndRangeState,
  getPoolFromPositionStateAndRangeState,
  getSortedCurrenciesTuple,
  getV2PriceRangeInfo,
  getV3PriceRangeInfo,
  getV4PriceRangeInfo,
  pairEnabledProtocolVersion,
  poolEnabledProtocolVersion,
  protocolShouldCalculateTaxes,
  validateCurrencyInput,
} from 'pages/Pool/Positions/create/utils'
import { useMemo } from 'react'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { PositionField } from 'types/position'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { Trans, useTranslation } from 'uniswap/src/i18n'

/**
 * @param state user-defined state for a position being created or migrated
 * @returns derived position information such as existing Pools
 */
export function useDerivedPositionInfo(state: PositionState): CreatePositionInfo {
  const { chainId } = useMultichainContext()
  const {
    currencyInputs: { TOKEN0: token0Input, TOKEN1: token1Input },
    protocolVersion,
  } = state

  const inputCurrencyInfo = useCurrencyInfo(token0Input)
  const outputCurrencyInfo = useCurrencyInfo(token1Input)
  const TOKEN0 = inputCurrencyInfo?.currency
  const TOKEN1 = outputCurrencyInfo?.currency

  const sortedCurrencies = getSortedCurrenciesTuple(TOKEN0, TOKEN1)
  const validCurrencyInput = validateCurrencyInput(sortedCurrencies)
  const poolsQueryEnabled = poolEnabledProtocolVersion(protocolVersion) && validCurrencyInput
  const { data: poolData, isLoading: poolIsLoading } = useGetPoolsByTokens(
    {
      fee: state.fee.feeAmount,
      chainId,
      protocolVersions: [protocolVersion],
      token0: getCurrencyAddressWithWrap(sortedCurrencies?.[0], protocolVersion),
      token1: getCurrencyAddressWithWrap(sortedCurrencies?.[1], protocolVersion),
      hooks: state.hook?.toLowerCase(), // BE does not accept checksummed addresses
    },
    poolsQueryEnabled,
  )

  const pool = poolData?.pools && poolData.pools.length > 0 ? poolData.pools[0] : undefined

  const { pairsQueryEnabled, sortedTokens } = useMemo(() => {
    if (!pairEnabledProtocolVersion(protocolVersion)) {
      return {
        pairsQueryEnabled: false,
      } as const
    }

    const sortedTokens = getSortedCurrenciesTuple(
      getCurrencyWithWrap(sortedCurrencies[0], protocolVersion),
      getCurrencyWithWrap(sortedCurrencies[1], protocolVersion),
    )

    if (!validateCurrencyInput(sortedTokens)) {
      return {
        pairsQueryEnabled: false,
      } as const
    }

    return {
      pairsQueryEnabled: true,
      sortedTokens,
    } as const
  }, [protocolVersion, sortedCurrencies])

  const pairResult = useV2Pair(sortedTokens?.[0], sortedTokens?.[1])
  const pairIsFetched = pairResult[0] === PairState.EXISTS
  const pairIsLoading = pairResult[0] === PairState.LOADING

  const { pair, v2Price } = useMemo(() => {
    const pair = pairsQueryEnabled ? pairResult[1] || undefined : undefined

    return { pair, v2Price: pair?.token0Price }
  }, [pairsQueryEnabled, pairResult])

  const { v3Pool, v3Price } = useMemo(() => {
    const v3Pool =
      protocolVersion === ProtocolVersion.V3
        ? getPoolFromRest({
            pool,
            token0: getCurrencyWithWrap(sortedCurrencies?.[0], protocolVersion),
            token1: getCurrencyWithWrap(sortedCurrencies?.[1], protocolVersion),
            protocolVersion,
          })
        : undefined

    return { v3Pool, v3Price: v3Pool?.token0Price }
  }, [protocolVersion, pool, sortedCurrencies])

  const { v4Pool, v4Price } = useMemo(() => {
    const v4Pool =
      protocolVersion === ProtocolVersion.V4
        ? getPoolFromRest({
            pool,
            token0: sortedCurrencies?.[0],
            token1: sortedCurrencies?.[1],
            protocolVersion,
            hooks: pool?.hooks?.address || '',
          })
        : undefined

    return { v4Pool, v4Price: v4Pool?.token0Price }
  }, [pool, protocolVersion, sortedCurrencies])

  const isPoolOutOfSync = useIsPoolOutOfSync(v4Price || v3Price || v2Price)

  const creatingPoolOrPair = useMemo(() => {
    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return false
    }

    if (protocolVersion === ProtocolVersion.V2) {
      if (!pairResult && pairIsFetched) {
        return true
      }

      return false
    }

    return poolData?.pools && poolData.pools.length === 0
  }, [protocolVersion, poolData?.pools, pairResult, pairIsFetched])

  return useMemo(() => {
    const currencies: [OptionalCurrency, OptionalCurrency] = [TOKEN0, TOKEN1]
    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return {
        currencies,
        protocolVersion: ProtocolVersion.V4,
        isPoolOutOfSync: false,
      }
    }

    if (protocolVersion === ProtocolVersion.V2) {
      return {
        currencies,
        protocolVersion,
        pair,
        creatingPoolOrPair,
        poolOrPairLoading: pairIsLoading,
        isPoolOutOfSync,
      } satisfies CreateV2PositionInfo
    }

    if (protocolVersion === ProtocolVersion.V3) {
      return {
        currencies,
        protocolVersion,
        pool: v3Pool,
        creatingPoolOrPair,
        poolOrPairLoading: poolIsLoading,
        isPoolOutOfSync,
        poolId: pool?.poolId,
      } satisfies CreateV3PositionInfo
    }

    return {
      currencies,
      protocolVersion, // V4
      pool: v4Pool,
      creatingPoolOrPair,
      poolOrPairLoading: poolIsLoading,
      isPoolOutOfSync,
      poolId: pool?.poolId,
    } satisfies CreateV4PositionInfo
  }, [
    TOKEN0,
    TOKEN1,
    protocolVersion,
    v4Pool,
    creatingPoolOrPair,
    poolIsLoading,
    isPoolOutOfSync,
    pool?.poolId,
    pair,
    pairIsLoading,
    v3Pool,
  ])
}

export function useDerivedPriceRangeInfo(state: PriceRangeState): PriceRangeInfo {
  const { positionState, derivedPositionInfo } = useCreatePositionContext()
  const { chainId } = useMultichainContext()

  const shouldUseTaxes = protocolShouldCalculateTaxes(derivedPositionInfo.protocolVersion)
  const { inputTax: currencyATax, outputTax: currencyBTax } = useSwapTaxes(
    shouldUseTaxes
      ? getCurrencyAddressWithWrap(derivedPositionInfo.currencies[0], derivedPositionInfo.protocolVersion)
      : undefined,
    shouldUseTaxes
      ? getCurrencyAddressWithWrap(derivedPositionInfo.currencies[1], derivedPositionInfo.protocolVersion)
      : undefined,
    chainId,
  )

  const priceRangeInfo = useMemo(() => {
    if (derivedPositionInfo.protocolVersion === ProtocolVersion.V2) {
      return getV2PriceRangeInfo({ state, derivedPositionInfo })
    }

    if (derivedPositionInfo.protocolVersion === ProtocolVersion.V3) {
      const isTaxed = currencyATax.greaterThan(0) || currencyBTax.greaterThan(0)
      return getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed })
    }

    return getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })
  }, [derivedPositionInfo, state, positionState, currencyATax, currencyBTax])

  return priceRangeInfo
}

export type UseDepositInfoProps = {
  protocolVersion: ProtocolVersion
  address?: string
  token0?: Currency
  token1?: Currency
  exactField: PositionField
  exactAmount?: string
  skipDependentAmount?: boolean
  deposit0Disabled?: boolean
  deposit1Disabled?: boolean
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

export function useDerivedDepositInfo(state: DepositState): DepositInfo {
  const account = useAccount()
  const { derivedPositionInfo } = useCreatePositionContext()
  const { derivedPriceRangeInfo } = usePriceRangeContext()
  const { exactAmount, exactField } = state
  const { protocolVersion } = derivedPriceRangeInfo

  const depositInfoProps: UseDepositInfoProps = useMemo(() => {
    if (protocolVersion === ProtocolVersion.V2) {
      return {
        protocolVersion,
        pair: getPairFromPositionStateAndRangeState({ derivedPositionInfo, derivedPriceRangeInfo }),
        address: account.address,
        token0: derivedPositionInfo.currencies[0],
        token1: derivedPositionInfo.currencies[1],
        exactField,
        exactAmount,
      } satisfies UseDepositInfoProps
    }

    const tickLower = derivedPriceRangeInfo.ticks?.[0]
    const tickUpper = derivedPriceRangeInfo.ticks?.[1]
    const { invalidRange, outOfRange, deposit0Disabled, deposit1Disabled } = derivedPriceRangeInfo

    if (protocolVersion === ProtocolVersion.V3) {
      return {
        protocolVersion,
        pool: getPoolFromPositionStateAndRangeState({ derivedPositionInfo, derivedPriceRangeInfo }),
        address: account.address,
        tickLower,
        tickUpper,
        token0: derivedPositionInfo.currencies[0],
        token1: derivedPositionInfo.currencies[1],
        exactField,
        exactAmount,
        skipDependentAmount: outOfRange || invalidRange,
        deposit0Disabled,
        deposit1Disabled,
      } satisfies UseDepositInfoProps
    }

    return {
      protocolVersion,
      pool: getPoolFromPositionStateAndRangeState({ derivedPositionInfo, derivedPriceRangeInfo }),
      address: account.address,
      tickLower,
      tickUpper,
      token0: derivedPositionInfo.currencies[0],
      token1: derivedPositionInfo.currencies[1],
      exactField,
      exactAmount,
      skipDependentAmount: outOfRange || invalidRange,
      deposit0Disabled,
      deposit1Disabled,
    } satisfies UseDepositInfoProps
  }, [account.address, derivedPositionInfo, derivedPriceRangeInfo, exactAmount, exactField, protocolVersion])

  return useDepositInfo(depositInfoProps)
}

export function useDepositInfo(state: UseDepositInfoProps): DepositInfo {
  const account = useAccount()
  const { protocolVersion, address, token0, token1, exactField, exactAmount, deposit0Disabled, deposit1Disabled } =
    state

  const [token0Balance, token1Balance] = useCurrencyBalances(address, [token0, token1])

  const [independentToken, dependentToken] = exactField === PositionField.TOKEN0 ? [token0, token1] : [token1, token0]
  const independentAmount = tryParseCurrencyAmount(exactAmount, independentToken)

  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    const shouldSkip = state.skipDependentAmount || protocolVersion === ProtocolVersion.UNSPECIFIED
    if (shouldSkip) {
      return dependentToken && CurrencyAmount.fromRawAmount(dependentToken, 0)
    }

    if (protocolVersion === ProtocolVersion.V2) {
      return getDependentAmountFromV2Pair({
        independentAmount,
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
  }, [state, protocolVersion, independentAmount, dependentToken, exactField, token0, token1])

  const independentTokenUSDValue = useUSDCValue(independentAmount) || undefined
  const dependentTokenUSDValue = useUSDCValue(dependentAmount) || undefined

  const dependentField = exactField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0

  const parsedAmounts: { [field in PositionField]: CurrencyAmount<Currency> | undefined } = useMemo(() => {
    return {
      [PositionField.TOKEN0]: exactField === PositionField.TOKEN0 ? independentAmount : dependentAmount,
      [PositionField.TOKEN1]: exactField === PositionField.TOKEN0 ? dependentAmount : independentAmount,
    }
  }, [dependentAmount, independentAmount, exactField])
  const { [PositionField.TOKEN0]: currency0Amount, [PositionField.TOKEN1]: currency1Amount } = parsedAmounts

  const { t } = useTranslation()
  const error = useMemo(() => {
    if (!account.isConnected) {
      return <ConnectWalletButtonText />
    }

    if (
      (!parsedAmounts[PositionField.TOKEN0] && !deposit0Disabled) ||
      (!parsedAmounts[PositionField.TOKEN1] && !deposit1Disabled)
    ) {
      return t('common.noAmount.error')
    }

    const insufficientToken0Balance = currency0Amount && token0Balance?.lessThan(currency0Amount)
    const insufficientToken1Balance = currency1Amount && token1Balance?.lessThan(currency1Amount)

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
    account.isConnected,
    parsedAmounts,
    deposit0Disabled,
    deposit1Disabled,
    currency0Amount,
    token0Balance,
    currency1Amount,
    token1Balance,
    t,
    token0?.symbol,
    token1?.symbol,
  ])

  return useMemo(
    () => ({
      currencyBalances: { [PositionField.TOKEN0]: token0Balance, [PositionField.TOKEN1]: token1Balance },
      formattedAmounts: { [exactField]: exactAmount, [dependentField]: dependentAmount?.toExact() },
      currencyAmounts: { [exactField]: independentAmount, [dependentField]: dependentAmount },
      currencyAmountsUSDValue: { [exactField]: independentTokenUSDValue, [dependentField]: dependentTokenUSDValue },
      error,
    }),
    [
      token0Balance,
      token1Balance,
      exactField,
      exactAmount,
      dependentField,
      dependentAmount,
      independentAmount,
      independentTokenUSDValue,
      dependentTokenUSDValue,
      error,
    ],
  )
}
