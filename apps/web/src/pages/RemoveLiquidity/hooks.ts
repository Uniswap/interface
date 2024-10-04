// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { getProtocolItems } from 'components/Liquidity/utils'
import { ZERO_ADDRESS } from 'constants/misc'
import JSBI from 'jsbi'
import { usePool } from 'pages/Pool/Positions/create/hooks'
import { useLiquidityModalContext } from 'pages/RemoveLiquidity/RemoveLiquidityModalContext'
import { RemoveLiquidityTxInfo } from 'pages/RemoveLiquidity/RemoveLiquidityTxContext'
import { useMemo } from 'react'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useReduceLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useReduceLpPositionCalldataQuery'
import {
  CheckApprovalLPRequest,
  DecreaseLPPositionRequest,
  ProtocolItems,
} from 'uniswap/src/data/tradingApi/__generated__'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function useRemoveLiquidityTxAndGasInfo({ account }: { account?: string }): RemoveLiquidityTxInfo {
  const { positionInfo, percent, percentInvalid } = useLiquidityModalContext()

  const pool = usePool(
    positionInfo?.currency0Amount.currency,
    positionInfo?.currency1Amount.currency,
    positionInfo?.feeTier ? Number(positionInfo.feeTier) : undefined,
    positionInfo?.currency0Amount.currency.chainId ?? UniverseChainId.Mainnet,
    positionInfo?.version,
  )

  const v2LpTokenApprovalQueryParams: CheckApprovalLPRequest | undefined = useMemo(() => {
    if (
      !positionInfo?.restPosition ||
      !positionInfo.liquidityToken ||
      percentInvalid ||
      !positionInfo.liquidityAmount
    ) {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: v2LpTokenApproval, isLoading: v2ApprovalLoading } = useCheckLpApprovalQuery({
    params: v2LpTokenApprovalQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })
  const { value: v2ApprovalGasFee } = useTransactionGasFee(v2LpTokenApproval?.positionTokenApproval)
  const gasFeeCurrencyAmount = CurrencyAmount.fromRawAmount(
    nativeOnChain(positionInfo?.liquidityToken?.chainId ?? UniverseChainId.Mainnet),
    v2ApprovalGasFee ?? '0',
  )
  const v2ApprovalGasFeeUSD = useUSDCValue(gasFeeCurrencyAmount) ?? undefined

  const reduceCalldataQueryParams: DecreaseLPPositionRequest | undefined = useMemo(() => {
    const apiProtocolItems = getProtocolItems(positionInfo?.version)
    if (!positionInfo?.restPosition || !apiProtocolItems || !account || percentInvalid) {
      return undefined
    }
    return {
      simulateTransaction: false,
      protocol: apiProtocolItems,
      tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
      chainId: positionInfo.currency0Amount.currency.chainId,
      walletAddress: account,
      collectAsWeth: false,
      liquidityPercentageToDecrease: Number(percent),
      poolLiquidity: pool?.liquidity,
      currentTick: pool?.tick,
      sqrtRatioX96: pool?.sqrtPriceX96,
      positionLiquidity:
        positionInfo.version === ProtocolVersion.V2
          ? positionInfo.liquidityAmount?.quotient.toString()
          : positionInfo.liquidity,
      // todo: use correct values here when included in Positions API response (v3+v4 only)
      expectedTokenOwed0RawAmount: positionInfo.version === ProtocolVersion.V2 ? undefined : '10',
      expectedTokenOwed1RawAmount: positionInfo.version === ProtocolVersion.V2 ? undefined : '10',
      // expectedTokenOwed0RawAmount: positionInfo.token0UncollectedFees,
      // expectedTokenOwed1RawAmount: positionInfo.token1UncollectedFees,
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
  }, [account, positionInfo, percentInvalid, percent, pool])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: reduceCalldata } = useReduceLpPositionCalldataQuery({
    params: reduceCalldataQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

  const { value: decreaseGasFee } = useTransactionGasFee(reduceCalldata?.decrease)
  const decreaseGasFeeCurrencyAmount = CurrencyAmount.fromRawAmount(
    nativeOnChain(positionInfo?.liquidityToken?.chainId ?? UniverseChainId.Mainnet),
    decreaseGasFee ?? '0',
  )
  const decreaseGasFeeUsd = useUSDCValue(decreaseGasFeeCurrencyAmount) ?? undefined
  return { decreaseGasFeeUsd, v2ApprovalGasFeeUSD, reduceCalldata, v2LpTokenApproval }
}
