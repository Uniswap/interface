import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { DepositInfo, DepositState } from 'components/Liquidity/types'
import { getPoolFromRest } from 'components/Liquidity/utils'
import { ConnectWalletButtonText } from 'components/NavBar/accountCTAsExperimentUtils'
import { ZERO_ADDRESS } from 'constants/misc'
import { checkIsNative, useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useIsPoolOutOfSync } from 'hooks/useIsPoolOutOfSync'
import { PoolState, usePool } from 'hooks/usePools'
import { PairState, useV2Pair } from 'hooks/useV2Pairs'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { useDefaultInitialPrice } from 'pages/Pool/Positions/create/hooks/useDefaultInitialPrice'
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
  validateCurrencyInput,
} from 'pages/Pool/Positions/create/utils'
import { ParsedQs } from 'qs'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { parseCurrencyFromURLParameter } from 'state/swap/hooks'
import { PositionField } from 'types/position'
import { WRAPPED_NATIVE_CURRENCY, nativeOnChain } from 'uniswap/src/constants/tokens'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/useMaxAmountSpend'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { getParsedChainId } from 'utils/chainParams'

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

  const TOKEN0 = token0Input
  const TOKEN1 = token1Input

  const sortedCurrencies = getSortedCurrenciesTuple(TOKEN0, TOKEN1)
  const validCurrencyInput = validateCurrencyInput(sortedCurrencies)
  const sortedTokens = getSortedCurrenciesTuple(
    getCurrencyWithWrap(sortedCurrencies[0], protocolVersion),
    getCurrencyWithWrap(sortedCurrencies[1], protocolVersion),
  )

  const poolsQueryEnabled = poolEnabledProtocolVersion(protocolVersion) && validCurrencyInput
  const {
    data: poolData,
    isLoading: poolIsLoading,
    refetch: refetchPoolData,
  } = useGetPoolsByTokens(
    {
      fee: state.fee.feeAmount,
      chainId,
      protocolVersions: [protocolVersion],
      token0: getCurrencyAddressWithWrap(sortedCurrencies?.[0], protocolVersion),
      token1: getCurrencyAddressWithWrap(sortedCurrencies?.[1], protocolVersion),
      hooks: state.hook?.toLowerCase() ?? ZERO_ADDRESS, // BE does not accept checksummed addresses
    },
    poolsQueryEnabled,
  )

  const pool = poolData?.pools && poolData.pools.length > 0 ? poolData.pools[0] : undefined

  const { pairsQueryEnabled } = useMemo(() => {
    if (!pairEnabledProtocolVersion(protocolVersion)) {
      return {
        pairsQueryEnabled: false,
      } as const
    }

    if (!validateCurrencyInput(sortedTokens)) {
      return {
        pairsQueryEnabled: false,
      } as const
    }

    return {
      pairsQueryEnabled: true,
    } as const
  }, [protocolVersion, sortedTokens])

  const pairResult = useV2Pair(sortedTokens?.[0], sortedTokens?.[1])
  const pairIsLoading = pairResult[0] === PairState.LOADING

  const pair = pairsQueryEnabled ? pairResult[1] || undefined : undefined

  const v3PoolResult = usePool(sortedTokens?.[0], sortedTokens?.[1], state.fee.feeAmount)
  const v3Pool = protocolVersion === ProtocolVersion.V3 ? v3PoolResult[1] ?? undefined : undefined
  const v3Price = v3Pool?.token0Price

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

    return poolData?.pools && poolData.pools.length === 0
  }, [protocolVersion, poolData?.pools, pairResult, v3PoolResult])

  const { price: defaultInitialPrice, isLoading: isDefaultInitialPriceLoading } = useDefaultInitialPrice({
    currencies: state.currencyInputs,
    skip: !creatingPoolOrPair,
  })

  return useMemo(() => {
    const currencies: [OptionalCurrency, OptionalCurrency] = [TOKEN0, TOKEN1]
    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return {
        currencies,
        protocolVersion: ProtocolVersion.V4,
        isPoolOutOfSync: false,
        defaultInitialPrice,
        isDefaultInitialPriceLoading,
        refetchPoolData: () => undefined,
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
        defaultInitialPrice,
        isDefaultInitialPriceLoading,
        refetchPoolData,
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
        defaultInitialPrice,
        isDefaultInitialPriceLoading,
        refetchPoolData,
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
      defaultInitialPrice,
      isDefaultInitialPriceLoading,
      refetchPoolData,
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
    defaultInitialPrice,
    isDefaultInitialPriceLoading,
    v3Pool,
    refetchPoolData,
  ])
}

export function useDerivedPriceRangeInfo(state: PriceRangeState): PriceRangeInfo {
  const { positionState, derivedPositionInfo } = useCreatePositionContext()

  const priceRangeInfo = useMemo(() => {
    if (derivedPositionInfo.protocolVersion === ProtocolVersion.V2) {
      return getV2PriceRangeInfo({ state, derivedPositionInfo })
    }

    if (derivedPositionInfo.protocolVersion === ProtocolVersion.V3) {
      return getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })
    }

    return getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })
  }, [derivedPositionInfo, state, positionState])

  return priceRangeInfo
}

export type UseDepositInfoProps = {
  protocolVersion: ProtocolVersion
  address?: string
  token0?: Currency
  token1?: Currency
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
  const { exactAmounts, exactField } = state
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
        exactAmounts,
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
        exactAmounts,
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
      exactAmounts,
      skipDependentAmount: outOfRange || invalidRange,
      deposit0Disabled,
      deposit1Disabled,
    } satisfies UseDepositInfoProps
  }, [account.address, derivedPositionInfo, derivedPriceRangeInfo, exactAmounts, exactField, protocolVersion])

  return useDepositInfo(depositInfoProps)
}

export function useDepositInfo(state: UseDepositInfoProps): DepositInfo {
  const account = useAccount()
  const { protocolVersion, address, token0, token1, exactField, exactAmounts, deposit0Disabled, deposit1Disabled } =
    state

  const { balance: token0Balance } = useOnChainCurrencyBalance(token0, address)
  const { balance: token1Balance } = useOnChainCurrencyBalance(token1, address)
  const token0MaxAmount = useMaxAmountSpend({ currencyAmount: token0Balance })
  const token1MaxAmount = useMaxAmountSpend({ currencyAmount: token1Balance })

  const [independentToken, dependentToken] = exactField === PositionField.TOKEN0 ? [token0, token1] : [token1, token0]
  const independentAmount = tryParseCurrencyAmount(exactAmounts[exactField], independentToken)
  const otherAmount = tryParseCurrencyAmount(
    exactAmounts[exactField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0],
    dependentToken,
  )

  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
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
    account.isConnected,
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
  const hookAddr = params?.hook
  if (!hookAddr || typeof hookAddr !== 'string') {
    return undefined
  }
  const validAddress = getValidAddress(hookAddr)
  return validAddress || undefined
}

// Prefill currency inputs from URL search params ?currencyA=ETH&currencyB=0x123...&chain=base
export function useInitialPoolInputs() {
  const { defaultChainId } = useEnabledChains()
  const defaultInitialToken = nativeOnChain(defaultChainId)

  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()
  const hookAddress = getParsedHookAddrParam(parsedQs)
  const parsedChainId = getParsedChainId(parsedQs)
  const supportedChainId = useSupportedChainId(parsedChainId) ?? defaultChainId

  const { currencyAddressA, currencyAddressB } = useMemo(() => {
    const currencyAddressA = parseCurrencyFromURLParameter(parsedQs.currencyA ?? parsedQs.currencya)
    const parsedCurrencyAddressB = parseCurrencyFromURLParameter(parsedQs.currencyB ?? parsedQs.currencyb)
    const currencyAddressB = parsedCurrencyAddressB === currencyAddressA ? undefined : parsedCurrencyAddressB

    // prevent weth + eth
    const isETHOrWETHA =
      checkIsNative(currencyAddressA) || currencyAddressA === WRAPPED_NATIVE_CURRENCY[supportedChainId]?.address
    const isETHOrWETHB =
      checkIsNative(currencyAddressB) || currencyAddressB === WRAPPED_NATIVE_CURRENCY[supportedChainId]?.address

    return {
      currencyAddressA,
      currencyAddressB: currencyAddressB && !(isETHOrWETHA && isETHOrWETHB) ? currencyAddressB : undefined,
    }
  }, [parsedQs.currencyA, parsedQs.currencyB, parsedQs.currencya, parsedQs.currencyb, supportedChainId])

  const currencyA = useCurrency(currencyAddressA, supportedChainId)
  const currencyB = useCurrency(currencyAddressB, supportedChainId)

  return useMemo(() => {
    return {
      [PositionField.TOKEN0]: currencyA ?? currencyB ?? defaultInitialToken,
      [PositionField.TOKEN1]: currencyA && currencyB ? currencyB : undefined,
      hook: hookAddress,
    }
  }, [currencyA, currencyB, hookAddress, defaultInitialToken])
}
