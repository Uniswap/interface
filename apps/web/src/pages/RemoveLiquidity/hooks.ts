// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { getProtocolItems, useV3PositionDerivedInfo } from 'components/Liquidity/utils'
import { ZERO_ADDRESS } from 'constants/misc'
import JSBI from 'jsbi'
import { useLiquidityModalContext } from 'pages/RemoveLiquidity/RemoveLiquidityModalContext'
import { RemoveLiquidityTxInfo } from 'pages/RemoveLiquidity/RemoveLiquidityTxContext'
import { useMemo } from 'react'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useDecreaseLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useDecreaseLpPositionCalldataQuery'
import {
  CheckApprovalLPRequest,
  DecreaseLPPositionRequest,
  ProtocolItems,
} from 'uniswap/src/data/tradingApi/__generated__'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function useRemoveLiquidityTxAndGasInfo({ account }: { account?: string }): RemoveLiquidityTxInfo {
  const { positionInfo, percent, percentInvalid } = useLiquidityModalContext()

  const pool = positionInfo?.version === ProtocolVersion.V3 ? positionInfo.pool : undefined

  const v2LpTokenApprovalQueryParams: CheckApprovalLPRequest | undefined = useMemo(() => {
    if (!positionInfo || !positionInfo.liquidityToken || percentInvalid || !positionInfo.liquidityAmount) {
      return undefined
    }
    return {
      protocol: ProtocolItems.V2,
      walletAddress: account,
      chainId: positionInfo.liquidityToken.chainId,
      positionToken: positionInfo.liquidityToken.address,
      positionAmount: positionInfo.liquidityAmount
        .multiply(JSBI.BigInt(percent))
        .divide(JSBI.BigInt(100))
        .quotient.toString(),
    }
  }, [positionInfo, percent, account, percentInvalid])
  const { data: v2LpTokenApproval, isLoading: v2ApprovalLoading } = useCheckLpApprovalQuery({
    params: v2LpTokenApprovalQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })
  const v2ApprovalGasFeeUSD =
    useUSDCurrencyAmountOfGasFee(
      positionInfo?.liquidityToken?.chainId,
      v2LpTokenApproval?.gasFeePositionTokenApproval,
    ) ?? undefined

  const approvalsNeeded = Boolean(v2LpTokenApproval)

  const { feeValue0, feeValue1 } = useV3PositionDerivedInfo(positionInfo)

  const decreaseCalldataQueryParams: DecreaseLPPositionRequest | undefined = useMemo(() => {
    const apiProtocolItems = getProtocolItems(positionInfo?.version)
    if (!positionInfo || !apiProtocolItems || !account || percentInvalid) {
      return undefined
    }
    return {
      simulateTransaction: !approvalsNeeded,
      protocol: apiProtocolItems,
      tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
      chainId: positionInfo.currency0Amount.currency.chainId,
      walletAddress: account,
      collectAsWeth: false,
      liquidityPercentageToDecrease: Number(percent),
      poolLiquidity: pool?.liquidity.toString(),
      currentTick: pool?.tickCurrent,
      sqrtRatioX96: pool?.sqrtRatioX96.toString(),
      positionLiquidity:
        positionInfo.version === ProtocolVersion.V2
          ? positionInfo.liquidityAmount?.quotient.toString()
          : positionInfo.liquidity,
      expectedTokenOwed0RawAmount: feeValue0?.quotient.toString(),
      expectedTokenOwed1RawAmount: feeValue1?.quotient.toString(),
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
          tickSpacing: positionInfo?.tickSpacing ? Number(positionInfo?.tickSpacing) : undefined,
          hooks: positionInfo.v4hook,
        },
      },
    }
  }, [account, positionInfo, percentInvalid, percent, pool, approvalsNeeded, feeValue0, feeValue1])

  const { data: decreaseCalldata, isLoading: decreaseCalldataLoading } = useDecreaseLpPositionCalldataQuery({
    params: decreaseCalldataQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

  const { value: estimatedGasFee } = useTransactionGasFee(decreaseCalldata?.decrease, !!decreaseCalldata?.gasFee)
  const decreaseGasFeeUsd =
    useUSDCurrencyAmountOfGasFee(decreaseCalldata?.decrease?.chainId, decreaseCalldata?.gasFee || estimatedGasFee) ??
    undefined

  const totalGasFeeEstimate = v2ApprovalGasFeeUSD ? decreaseGasFeeUsd?.add(v2ApprovalGasFeeUSD) : decreaseGasFeeUsd

  return {
    gasFeeEstimateUSD: totalGasFeeEstimate,
    decreaseCalldataLoading,
    decreaseCalldata,
    v2LpTokenApproval,
    approvalLoading: v2ApprovalLoading,
  }
}
