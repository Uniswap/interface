// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useIncreaseLiquidityContext } from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { useModalLiquidityInitialState } from 'components/Liquidity/hooks'
import { getProtocolItems } from 'components/Liquidity/utils'
import { ZERO_ADDRESS } from 'constants/misc'
import { getCurrencyAddressForTradingApi } from 'pages/Pool/Positions/create/utils'
import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import { PositionField } from 'types/position'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useIncreaseLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useIncreaseLpPositionCalldataQuery'
import {
  CheckApprovalLPRequest,
  IncreaseLPPositionRequest,
  IndependentToken,
} from 'uniswap/src/data/tradingApi/__generated__'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import {
  IncreasePositionTxAndGasInfo,
  LiquidityTransactionType,
} from 'uniswap/src/features/transactions/liquidity/types'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useAccount } from 'wagmi'

interface IncreasePositionContextType {
  txInfo?: IncreasePositionTxAndGasInfo
  gasFeeEstimateUSD?: CurrencyAmount<Currency>
  error?: boolean
  refetch?: () => void
}

const IncreaseLiquidityTxContext = createContext<IncreasePositionContextType | undefined>(undefined)

export function IncreaseLiquidityTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const positionInfo = useModalLiquidityInitialState()
  const { derivedIncreaseLiquidityInfo, increaseLiquidityState } = useIncreaseLiquidityContext()
  const { customDeadline, customSlippageTolerance } = useTransactionSettingsContext()

  const { currencyAmounts, error } = derivedIncreaseLiquidityInfo
  const { exactField } = increaseLiquidityState

  const account = useAccount()

  const increaseLiquidityApprovalParams: CheckApprovalLPRequest | undefined = useMemo(() => {
    if (!positionInfo || !account.address || !currencyAmounts?.TOKEN0 || !currencyAmounts?.TOKEN1) {
      return undefined
    }
    return {
      simulateTransaction: true,
      walletAddress: account.address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      protocol: getProtocolItems(positionInfo.version),
      token0: getCurrencyAddressForTradingApi(positionInfo.currency0Amount.currency),
      token1: getCurrencyAddressForTradingApi(positionInfo.currency1Amount.currency),
      amount0: currencyAmounts?.TOKEN0?.quotient.toString(),
      amount1: currencyAmounts?.TOKEN1?.quotient.toString(),
    }
  }, [positionInfo, account.address, currencyAmounts])

  const {
    data: increaseLiquidityTokenApprovals,
    isLoading: approvalLoading,
    error: approvalError,
    refetch: approvalRefetch,
  } = useCheckLpApprovalQuery({
    params: increaseLiquidityApprovalParams,
    staleTime: 5 * ONE_SECOND_MS,
    enabled: !error,
  })

  if (approvalError) {
    logger.info('IncreaseLiquidityTxContext', 'IncreaseLiquidityTxContext', 'CheckLpApprovalQuery', {
      error: JSON.stringify(approvalError),
      increaseLiquidityApprovalParams: JSON.stringify(increaseLiquidityApprovalParams),
    })
  }

  const {
    token0Approval,
    token1Approval,
    positionTokenApproval,
    permitData,
    gasFeeToken0Approval,
    gasFeeToken1Approval,
    gasFeePositionTokenApproval,
  } = increaseLiquidityTokenApprovals || {}
  const gasFeeToken0USD = useUSDCurrencyAmountOfGasFee(
    positionInfo?.currency0Amount.currency.chainId,
    gasFeeToken0Approval,
  )
  const gasFeeToken1USD = useUSDCurrencyAmountOfGasFee(
    positionInfo?.currency1Amount.currency.chainId,
    gasFeeToken1Approval,
  )
  const gasFeeLiquidityTokenUSD = useUSDCurrencyAmountOfGasFee(
    positionInfo?.liquidityToken?.chainId,
    gasFeePositionTokenApproval,
  )

  const approvalsNeeded =
    !approvalLoading && Boolean(permitData || token0Approval || token1Approval || positionTokenApproval)

  const increaseCalldataQueryParams = useMemo((): IncreaseLPPositionRequest | undefined => {
    const apiProtocolItems = getProtocolItems(positionInfo?.version)
    if (
      !positionInfo ||
      !account.address ||
      !apiProtocolItems ||
      !currencyAmounts?.TOKEN0 ||
      !currencyAmounts?.TOKEN1
    ) {
      return undefined
    }

    const token0 = currencyAmounts.TOKEN0.currency
    const token1 = currencyAmounts.TOKEN1.currency
    const amount0 = currencyAmounts.TOKEN0.quotient.toString()
    const amount1 = currencyAmounts.TOKEN1.quotient.toString()

    const [independentAmount, dependentAmount] =
      exactField === PositionField.TOKEN0 ? [amount0, amount1] : [amount1, amount0]
    const independentToken = exactField === PositionField.TOKEN0 ? IndependentToken.TOKEN_0 : IndependentToken.TOKEN_1

    return {
      simulateTransaction: !approvalsNeeded,
      protocol: apiProtocolItems,
      tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
      walletAddress: account.address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      independentAmount,
      independentToken,
      defaultDependentAmount: positionInfo.version === ProtocolVersion.V2 ? dependentAmount : undefined,
      position: {
        tickLower: positionInfo.tickLower ? Number(positionInfo.tickLower) : undefined,
        tickUpper: positionInfo.tickUpper ? Number(positionInfo.tickUpper) : undefined,
        pool: {
          token0: token0.isNative ? ZERO_ADDRESS : token0.address,
          token1: token1.isNative ? ZERO_ADDRESS : token1.address,
          fee: positionInfo.feeTier ? Number(positionInfo.feeTier) : undefined,
          tickSpacing: positionInfo.tickSpacing ? Number(positionInfo.tickSpacing) : undefined,
          hooks: positionInfo.v4hook,
        },
      },
      slippageTolerance: customSlippageTolerance,
    }
  }, [account, positionInfo, currencyAmounts, approvalsNeeded, customSlippageTolerance, exactField])

  const {
    data: increaseCalldata,
    isLoading: isCalldataLoading,
    error: calldataError,
    refetch: calldataRefetch,
  } = useIncreaseLpPositionCalldataQuery({
    params: increaseCalldataQueryParams,
    deadlineInMinutes: customDeadline,
    refetchInterval: 5 * ONE_SECOND_MS,
    enabled: !error && !approvalLoading && !approvalError && Boolean(increaseCalldataQueryParams),
  })
  const { increase, gasFee: actualGasFee, dependentAmount } = increaseCalldata || {}

  if (calldataError) {
    logger.warn('IncreaseLiquidityTxContext', 'IncreaseLiquidityTxContext', 'IncreaseLpPositionCalldataQuery', {
      error: JSON.stringify(calldataError),
      increaseCalldataQueryParams: JSON.stringify(increaseCalldataQueryParams),
    })
  }

  const { value: calculatedGasFee } = useTransactionGasFee(increase, !!actualGasFee)
  const increaseGasFeeUsd = useUSDCurrencyAmountOfGasFee(
    increaseCalldata?.increase?.chainId,
    actualGasFee || calculatedGasFee,
  )

  const increaseLiquidityTxContext = useMemo((): IncreasePositionTxAndGasInfo | undefined => {
    if (
      !positionInfo ||
      approvalLoading ||
      isCalldataLoading ||
      !increaseCalldata ||
      !currencyAmounts?.TOKEN0 ||
      !currencyAmounts?.TOKEN1
    ) {
      return undefined
    }

    const approveToken0Request = validateTransactionRequest(token0Approval)
    const approveToken1Request = validateTransactionRequest(token1Approval)
    const approvePositionTokenRequest = validateTransactionRequest(positionTokenApproval)
    const permit = validatePermit(permitData)
    const unsigned = Boolean(permitData)
    const txRequest = validateTransactionRequest(increase)

    return {
      type: LiquidityTransactionType.Increase,
      protocolVersion: positionInfo?.version,
      action: {
        type: LiquidityTransactionType.Increase,
        currency0Amount: currencyAmounts?.TOKEN0,
        currency1Amount: currencyAmounts?.TOKEN1,
        liquidityToken: positionInfo.liquidityToken,
      },
      approveToken0Request,
      approveToken1Request,
      approvePositionTokenRequest,
      revocationTxRequest: undefined, // TODO: add support for revokes
      permit,
      increasePositionRequestArgs: { ...increaseCalldataQueryParams, batchPermitData: permitData ?? undefined },
      txRequest,
      unsigned,
      dependentAmount,
    }
  }, [
    approvalLoading,
    isCalldataLoading,
    increaseCalldata,
    permitData,
    positionInfo,
    positionTokenApproval,
    dependentAmount,
    token0Approval,
    token1Approval,
    increaseCalldataQueryParams,
    increase,
    currencyAmounts,
  ])

  const totalGasFee = useMemo(() => {
    const fees = [gasFeeToken0USD, gasFeeToken1USD, gasFeeLiquidityTokenUSD, increaseGasFeeUsd]
    return fees.reduce((total, fee) => {
      if (fee && total) {
        return total.add(fee)
      }
      return total || fee
    })
  }, [gasFeeToken0USD, gasFeeToken1USD, gasFeeLiquidityTokenUSD, increaseGasFeeUsd])

  const value = {
    txInfo: increaseLiquidityTxContext,
    gasFeeEstimateUSD: totalGasFee ?? undefined,
    error: Boolean(approvalError || calldataError),
    refetch: approvalError ? approvalRefetch : calldataError ? calldataRefetch : undefined,
  }

  return <IncreaseLiquidityTxContext.Provider value={value}>{children}</IncreaseLiquidityTxContext.Provider>
}

export const useIncreaseLiquidityTxContext = (): IncreasePositionContextType => {
  const increaseContext = useContext(IncreaseLiquidityTxContext)

  if (!increaseContext) {
    throw new Error('`useIncreaseLiquidityTxContext` must be used inside of `IncreaseLiquidityTxContextProvider`')
  }

  return increaseContext
}
