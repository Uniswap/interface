import { Pool, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, TICK_SPACINGS, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { DepositInfo, DepositState } from 'components/Liquidity/types'
import { getFeeTierKey, getPoolFromRest, isDynamicFeeTier } from 'components/Liquidity/utils'
import { checkIsNative, useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useIsPoolOutOfSync } from 'hooks/useIsPoolOutOfSync'
import { PoolState, usePool } from 'hooks/usePools'
import { PairState, useV2Pair } from 'hooks/useV2Pairs'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { useDefaultInitialPrice } from 'pages/Pool/Positions/create/hooks/useDefaultInitialPrice'
import { useNativeTokenPercentageBufferExperiment } from 'pages/Pool/Positions/create/hooks/useNativeTokenPercentageBufferExperiment'
import {
  CreatePositionInfo,
  CreateV2PositionInfo,
  CreateV3PositionInfo,
  CreateV4PositionInfo,
  DEFAULT_FEE_DATA,
  FeeData,
  PositionState,
  PriceRangeInfo,
  PriceRangeState,
} from 'pages/Pool/Positions/create/types'
import {
  getCurrencyWithWrap,
  getDependentAmountFromV2Pair,
  getDependentAmountFromV3Position,
  getDependentAmountFromV4Position,
  getPairFromPositionStateAndRangeState,
  getPoolFromPositionStateAndRangeState,
  getSortedCurrenciesForProtocol,
  getTokenOrZeroAddress,
  getV2PriceRangeInfo,
  getV3PriceRangeInfo,
  getV4PriceRangeInfo,
  pairEnabledProtocolVersion,
  poolEnabledProtocolVersion,
  validateCurrencyInput,
} from 'pages/Pool/Positions/create/utils'
import { ParsedQs } from 'qs'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { parseCurrencyFromURLParameter } from 'state/swap/hooks'
import { PositionField } from 'types/position'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { WRAPPED_NATIVE_CURRENCY, nativeOnChain } from 'uniswap/src/constants/tokens'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/useMaxAmountSpend'
import { applyNativeTokenPercentageBuffer } from 'uniswap/src/features/gas/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { getParsedChainId } from 'utils/chainParams'

function filterPoolByFeeTier(pool: Pool, feeTier: FeeData): Pool | undefined {
  if (getFeeTierKey(feeTier.feeAmount, feeTier.isDynamic) === getFeeTierKey(pool.fee, pool.isDynamicFee)) {
    return pool
  }
  return undefined
}

/**
 * @param state user-defined state for a position being created or migrated
 * @returns derived position information such as existing Pools
 */
export function useDerivedPositionInfo(
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> },
  state: PositionState,
): CreatePositionInfo {
  const { chainId } = useMultichainContext()
  const { protocolVersion } = state
  const { tokenA, tokenB } = currencyInputs

  const sortedCurrencies = getSortedCurrenciesForProtocol({ a: tokenA, b: tokenB, protocolVersion })
  const validCurrencyInput = validateCurrencyInput(sortedCurrencies)

  const poolsQueryEnabled = poolEnabledProtocolVersion(protocolVersion) && validCurrencyInput
  const token0 = getCurrencyWithWrap(sortedCurrencies.TOKEN0, protocolVersion)
  const token1 = getCurrencyWithWrap(sortedCurrencies.TOKEN1, protocolVersion)
  const {
    data: poolData,
    isLoading: poolIsLoading,
    refetch: refetchPoolData,
  } = useGetPoolsByTokens(
    {
      fee: state.fee.feeAmount,
      chainId,
      protocolVersions: [protocolVersion],
      token0: getTokenOrZeroAddress(token0),
      token1: getTokenOrZeroAddress(token1),
      hooks: state.hook?.toLowerCase() ?? ZERO_ADDRESS, // BE does not accept checksummed addresses
    },
    poolsQueryEnabled,
  )

  const pool =
    poolData?.pools && poolData.pools.length > 0 ? filterPoolByFeeTier(poolData.pools[0], state.fee) : undefined

  const pairResult = useV2Pair(sortedCurrencies.TOKEN0?.wrapped, sortedCurrencies.TOKEN1?.wrapped)
  const pairIsLoading = pairResult[0] === PairState.LOADING

  const pair =
    validCurrencyInput && pairEnabledProtocolVersion(protocolVersion) ? pairResult[1] || undefined : undefined

  const v3PoolResult = usePool({
    currencyA: sortedCurrencies.TOKEN0?.wrapped,
    currencyB: sortedCurrencies.TOKEN1?.wrapped,
    feeAmount: state.fee.feeAmount,
  })
  const v3Pool = protocolVersion === ProtocolVersion.V3 ? v3PoolResult[1] ?? undefined : undefined
  const v3Price = v3Pool?.token0Price

  const { v4Pool, v4Price } = useMemo(() => {
    const v4Pool =
      protocolVersion === ProtocolVersion.V4
        ? getPoolFromRest({
            pool,
            token0: sortedCurrencies.TOKEN0,
            token1: sortedCurrencies.TOKEN1,
            protocolVersion,
            hooks: pool?.hooks?.address || '',
          })
        : undefined

    return { v4Pool, v4Price: v4Pool?.token0Price }
  }, [pool, protocolVersion, sortedCurrencies])

  const isPoolOutOfSync = useIsPoolOutOfSync(v4Price || v3Price)

  const creatingPoolOrPair = useMemo(() => {
    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return false
    }

    if (protocolVersion === ProtocolVersion.V2) {
      return pairResult[0] === PairState.NOT_EXISTS
    }

    if (protocolVersion === ProtocolVersion.V3) {
      return v3PoolResult[0] === PoolState.NOT_EXISTS
    }

    return !pool
  }, [protocolVersion, pairResult, v3PoolResult, pool])

  const { price: defaultInitialPrice, isLoading: isDefaultInitialPriceLoading } = useDefaultInitialPrice({
    currencies: {
      [PositionField.TOKEN0]: sortedCurrencies.TOKEN0,
      [PositionField.TOKEN1]: sortedCurrencies.TOKEN1,
    },
    // V2 create flow doesn't show the liquidity range chart so we always want
    // to get the default initial price for DisplayCurrentPrice in deposit step
    skip: !creatingPoolOrPair && pool?.protocolVersion === ProtocolVersion.V2,
  })

  return useMemo(() => {
    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return {
        currencies: {
          display: sortedCurrencies,
          sdk: sortedCurrencies,
        },
        protocolVersion: ProtocolVersion.V4,
        isPoolOutOfSync: false,
        defaultInitialPrice,
        isDefaultInitialPriceLoading,
        refetchPoolData: () => undefined,
      }
    }

    if (protocolVersion === ProtocolVersion.V2) {
      return {
        currencies: {
          display: sortedCurrencies,
          sdk: {
            [PositionField.TOKEN0]: sortedCurrencies.TOKEN0?.wrapped,
            [PositionField.TOKEN1]: sortedCurrencies.TOKEN1?.wrapped,
          },
        },
        chainId: sortedCurrencies.TOKEN0?.chainId,
        protocolVersion,
        pair,
        creatingPoolOrPair,
        poolOrPairLoading: pairIsLoading,
        isPoolOutOfSync,
        defaultInitialPrice,
        isDefaultInitialPriceLoading,
        refetchPoolData,
      } satisfies CreateV2PositionInfo
    }

    if (protocolVersion === ProtocolVersion.V3) {
      return {
        currencies: {
          display: sortedCurrencies,
          sdk: {
            [PositionField.TOKEN0]: sortedCurrencies.TOKEN0?.wrapped,
            [PositionField.TOKEN1]: sortedCurrencies.TOKEN1?.wrapped,
          },
        },
        chainId: sortedCurrencies.TOKEN0?.chainId,
        protocolVersion,
        pool: v3Pool,
        creatingPoolOrPair,
        poolOrPairLoading: poolIsLoading,
        isPoolOutOfSync,
        poolId: pool?.poolId,
        defaultInitialPrice,
        isDefaultInitialPriceLoading,
        refetchPoolData,
      } satisfies CreateV3PositionInfo
    }

    return {
      currencies: {
        display: sortedCurrencies,
        sdk: sortedCurrencies,
      },
      chainId: sortedCurrencies.TOKEN0?.chainId,
      protocolVersion, // V4
      pool: v4Pool,
      creatingPoolOrPair,
      poolOrPairLoading: poolIsLoading,
      isPoolOutOfSync,
      poolId: pool?.poolId,
      boostedApr: pool?.boostedApr,
      defaultInitialPrice,
      isDefaultInitialPriceLoading,
      refetchPoolData,
    } satisfies CreateV4PositionInfo
  }, [
    protocolVersion,
    v4Pool,
    creatingPoolOrPair,
    poolIsLoading,
    isPoolOutOfSync,
    pool?.poolId,
    pair,
    pairIsLoading,
    defaultInitialPrice,
    isDefaultInitialPriceLoading,
    v3Pool,
    refetchPoolData,
    pool?.boostedApr,
    sortedCurrencies,
  ])
}

export function useDerivedPriceRangeInfo(state: PriceRangeState): PriceRangeInfo {
  const { positionState, derivedPositionInfo } = useCreatePositionContext()

  const priceRangeInfo = useMemo(() => {
    return getPriceRangeInfo({ derivedPositionInfo, state, positionState })
  }, [derivedPositionInfo, state, positionState])

  return priceRangeInfo
}

export function getPriceRangeInfo({
  derivedPositionInfo,
  state,
  positionState,
}: {
  derivedPositionInfo: CreatePositionInfo
  state: PriceRangeState
  positionState: PositionState
}): PriceRangeInfo {
  if (derivedPositionInfo.protocolVersion === ProtocolVersion.V2) {
    return getV2PriceRangeInfo({ state, derivedPositionInfo })
  }

  if (derivedPositionInfo.protocolVersion === ProtocolVersion.V3) {
    return getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })
  }

  return getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })
}

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

  const depositInfoProps = useMemo(() => {
    return getDepositInfoProps({ address: account.address, derivedPositionInfo, state, derivedPriceRangeInfo })
  }, [account.address, derivedPositionInfo, state, derivedPriceRangeInfo])

  return useDepositInfo(depositInfoProps)
}

export function getDepositInfoProps({
  address,
  derivedPositionInfo,
  derivedPriceRangeInfo,
  state,
}: {
  address?: string
  derivedPositionInfo: CreatePositionInfo
  derivedPriceRangeInfo: PriceRangeInfo
  state: DepositState
}): UseDepositInfoProps {
  const { exactAmounts, exactField } = state
  const { protocolVersion } = derivedPriceRangeInfo

  if (protocolVersion === ProtocolVersion.V2) {
    return {
      protocolVersion,
      pair: getPairFromPositionStateAndRangeState({ derivedPositionInfo, derivedPriceRangeInfo }),
      address,
      token0: derivedPositionInfo.currencies.display.TOKEN0,
      token1: derivedPositionInfo.currencies.display.TOKEN1,
      exactField,
      exactAmounts,
    } satisfies UseDepositInfoProps
  }

  const tickLower = derivedPriceRangeInfo.ticks[0]
  const tickUpper = derivedPriceRangeInfo.ticks[1]
  const { invalidRange, outOfRange, deposit0Disabled, deposit1Disabled } = derivedPriceRangeInfo

  if (protocolVersion === ProtocolVersion.V3) {
    return {
      protocolVersion,
      pool: getPoolFromPositionStateAndRangeState({ derivedPositionInfo, derivedPriceRangeInfo }),
      address,
      tickLower: tickLower ?? undefined,
      tickUpper: tickUpper ?? undefined,
      token0: derivedPositionInfo.currencies.display.TOKEN0,
      token1: derivedPositionInfo.currencies.display.TOKEN1,
      exactField,
      exactAmounts,
      skipDependentAmount: outOfRange || invalidRange,
      deposit0Disabled,
      deposit1Disabled,
    } satisfies UseDepositInfoProps
  }

  return {
    protocolVersion,
    pool: getPoolFromPositionStateAndRangeState({ derivedPositionInfo, derivedPriceRangeInfo }),
    address,
    tickLower: tickLower ?? undefined,
    tickUpper: tickUpper ?? undefined,
    token0: derivedPositionInfo.currencies.display.TOKEN0,
    token1: derivedPositionInfo.currencies.display.TOKEN1,
    exactField,
    exactAmounts,
    skipDependentAmount: outOfRange || invalidRange,
    deposit0Disabled,
    deposit1Disabled,
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
  const { protocolVersion, address, token0, token1, exactField, exactAmounts, deposit0Disabled, deposit1Disabled } =
    state

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
    if (
      (!parsedAmounts[PositionField.TOKEN0] && !deposit0Disabled) ||
      (!parsedAmounts[PositionField.TOKEN1] && !deposit1Disabled)
    ) {
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
    deposit0Disabled,
    deposit1Disabled,
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

function getParsedHookAddrParam(params: ParsedQs): string | undefined {
  const hookAddr = params.hook
  if (!hookAddr || typeof hookAddr !== 'string') {
    return undefined
  }
  const validAddress = getValidAddress({ address: hookAddr, withEVMChecksum: true, platform: Platform.EVM })
  return validAddress || undefined
}

function getParsedFeeTierParam(params: ParsedQs): FeeData | undefined {
  const feeTier = params.feeTier
  if (!feeTier || typeof feeTier !== 'string') {
    return DEFAULT_FEE_DATA
  }
  const feeTierNumber = parseInt(feeTier)
  if (isNaN(feeTierNumber)) {
    return DEFAULT_FEE_DATA
  }

  const tickSpacing = TICK_SPACINGS[feeTierNumber as FeeAmount]
  if (!tickSpacing) {
    return DEFAULT_FEE_DATA
  }

  return {
    feeAmount: feeTierNumber,
    tickSpacing,
    isDynamic: isDynamicFeeTier({
      feeAmount: feeTierNumber,
      tickSpacing,
      isDynamic: false,
    }),
  }
}

// Prefill currency inputs from URL search params ?currencyA=ETH&currencyB=0x123...&chain=base&feeTier=10000&hook=0x123...
export function useInitialPoolInputs() {
  const { defaultChainId } = useEnabledChains()
  const defaultInitialToken = nativeOnChain(defaultChainId)

  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()
  const hook = getParsedHookAddrParam(parsedQs)
  const parsedChainId = getParsedChainId(parsedQs, CurrencyField.INPUT)
  const supportedChainId = useSupportedChainId(parsedChainId) ?? defaultChainId
  const fee = getParsedFeeTierParam(parsedQs)
  const { currencyAddressA, currencyAddressB } = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const currencyAddressA = parseCurrencyFromURLParameter(parsedQs.currencyA ?? parsedQs.currencya)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const parsedCurrencyAddressB = parseCurrencyFromURLParameter(parsedQs.currencyB ?? parsedQs.currencyb)
    const currencyAddressB = parsedCurrencyAddressB === currencyAddressA ? undefined : parsedCurrencyAddressB

    // prevent weth + eth
    const isETHOrWETHA =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      checkIsNative(currencyAddressA) || currencyAddressA === WRAPPED_NATIVE_CURRENCY[supportedChainId]?.address
    const isETHOrWETHB =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      checkIsNative(currencyAddressB) || currencyAddressB === WRAPPED_NATIVE_CURRENCY[supportedChainId]?.address

    return {
      currencyAddressA,
      currencyAddressB: currencyAddressB && !(isETHOrWETHA && isETHOrWETHB) ? currencyAddressB : undefined,
    }
  }, [parsedQs.currencyA, parsedQs.currencyB, parsedQs.currencya, parsedQs.currencyb, supportedChainId])

  const currencyA = useCurrency({ address: currencyAddressA, chainId: supportedChainId })
  const currencyB = useCurrency({ address: currencyAddressB, chainId: supportedChainId })

  return useMemo(() => {
    return {
      tokenA: currencyA ?? currencyB ?? defaultInitialToken,
      tokenB: currencyA && currencyB ? currencyB : undefined,
      fee,
      hook,
    }
  }, [currencyA, currencyB, fee, hook, defaultInitialToken])
}
