import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useIncreaseLiquidityContext } from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { getProtocolItems, useModalLiquidityPositionInfo } from 'components/Liquidity/utils'
import { ZERO_ADDRESS } from 'constants/misc'
import { usePool } from 'pages/Pool/Positions/create/hooks'
import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useIncreaseLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useIncreaseLpPositionCalldataQuery'
import { CheckApprovalLPRequest, IncreaseLPPositionRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { IncreasePositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useAccount } from 'wagmi'

interface IncreasePositionContextType {
  txInfo?: IncreasePositionTxAndGasInfo
  gasFeeEstimateUSD?: CurrencyAmount<Currency>
}

const IncreaseLiquidityTxContext = createContext<IncreasePositionContextType | undefined>(undefined)

export function IncreaseLiquidityTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const positionInfo = useModalLiquidityPositionInfo()
  const { derivedIncreaseLiquidityInfo } = useIncreaseLiquidityContext()

  const { currencyAmounts } = derivedIncreaseLiquidityInfo

  const pool = usePool(
    positionInfo?.currency0Amount.currency,
    positionInfo?.currency1Amount.currency,
    positionInfo?.feeTier ? Number(positionInfo.feeTier) : undefined,
    positionInfo?.currency0Amount.currency.chainId ?? UniverseChainId.Mainnet,
    positionInfo?.version,
  )

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
      token0: positionInfo.currency0Amount.currency.isNative
        ? ZERO_ADDRESS
        : positionInfo.currency0Amount.currency.address,
      token1: positionInfo.currency1Amount.currency.isNative
        ? ZERO_ADDRESS
        : positionInfo.currency1Amount.currency.address,
      amount0: currencyAmounts?.TOKEN0?.quotient.toString(),
      amount1: currencyAmounts?.TOKEN1?.quotient.toString(),
    }
  }, [positionInfo, account.address, currencyAmounts])

  const { data: increaseLiquidityTokenApprovals, isLoading: approvalLoading } = useCheckLpApprovalQuery({
    params: increaseLiquidityApprovalParams,
    staleTime: 5 * ONE_SECOND_MS,
  })
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

  const approvalsNeeded = Boolean(permitData || token0Approval || token1Approval || positionTokenApproval)

  const increaseCalldataQueryParams: IncreaseLPPositionRequest | undefined = useMemo(() => {
    const apiProtocolItems = getProtocolItems(positionInfo?.version)
    const amount0 = currencyAmounts?.TOKEN0?.quotient.toString()
    const amount1 = currencyAmounts?.TOKEN1?.quotient.toString()
    if (!positionInfo || !account.address || !apiProtocolItems || !amount0 || !amount1) {
      return undefined
    }
    return {
      simulateTransaction: !approvalsNeeded,
      protocol: apiProtocolItems,
      tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
      walletAddress: account.address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      amount0,
      amount1,
      poolLiquidity: pool?.liquidity,
      currentTick: pool?.tick,
      sqrtRatioX96: pool?.sqrtPriceX96,
      position: {
        tickLower: positionInfo.tickLower ? Number(positionInfo.tickLower) : undefined,
        tickUpper: positionInfo.tickUpper ? Number(positionInfo.tickUpper) : undefined,
        pool: {
          token0: positionInfo.currency0Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency0Amount.currency.address,
          token1: positionInfo.currency1Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency1Amount.currency.address,
          fee: positionInfo.feeTier ? Number(positionInfo.feeTier) : undefined,
          tickSpacing: positionInfo.tickSpacing ? Number(positionInfo.tickSpacing) : undefined,
          hooks: positionInfo.v4hook,
        },
      },
    }
  }, [account, positionInfo, pool, currencyAmounts, approvalsNeeded])

  const { data: increaseCalldata, isLoading: isCalldataLoading } = useIncreaseLpPositionCalldataQuery({
    params: increaseCalldataQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })
  const { increase, gasFee: actualGasFee } = increaseCalldata || {}

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
      type: 'increase',
      protocolVersion: positionInfo?.version,
      action: {
        currency0Amount: currencyAmounts?.TOKEN0,
        currency1Amount: currencyAmounts?.TOKEN1,
        liquidityToken: positionInfo.liquidityToken,
      },
      approveToken0Request,
      approveToken1Request,
      approvePositionTokenRequest,
      revocationTxRequest: undefined, // TODO: add support for revokes
      permit,
      increasePositionRequestArgs: increaseCalldataQueryParams,
      txRequest,
      unsigned,
    }
  }, [
    approvalLoading,
    isCalldataLoading,
    increaseCalldata,
    permitData,
    positionInfo,
    positionTokenApproval,
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
