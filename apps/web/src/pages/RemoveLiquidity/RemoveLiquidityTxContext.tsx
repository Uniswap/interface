import type { DecreasePositionResponse as V2DecreasePositionResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import type { LPToken } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { areEvmAddressesEqual, Platform } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import type { NormalizedApprovalData } from 'uniswap/src/data/apiClients/liquidityService/normalizeApprovalResponse'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { DelegatedState } from 'uniswap/src/features/smartWallet/delegation/types'
import type { ValidatedDecreasePositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'
import { LiquidityTransactionType } from 'uniswap/src/features/transactions/liquidity/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'
import { useRemoveLiquidityTxAndGasInfo } from '~/pages/RemoveLiquidity/hooks/useRemoveLiquidityTxAndGasInfo'
import { useRemoveLiquidityModalContext } from '~/pages/RemoveLiquidity/RemoveLiquidityModalContext'

export type RemoveLiquidityTxInfo = {
  gasFeeEstimateUSD?: CurrencyAmount<Currency>
  v2LpTokenApproval?: NormalizedApprovalData
  decreaseCalldata?: V2DecreasePositionResponse
  decreaseCalldataLoading: boolean
  approvalLoading: boolean
  txContext?: ValidatedDecreasePositionTxAndGasInfo
  /**
   * What the decrease returns, in the (optionally unwrapped) display currencies: the service's quote when it
   * has one, else the displayed position's share. The review card and the transaction read the same values,
   * so the user signs the number they were shown.
   */
  currency0AmountToRemove?: CurrencyAmount<Currency>
  currency1AmountToRemove?: CurrencyAmount<Currency>
  error: boolean | string
  refetch?: () => void
}

const RemoveLiquidityTxContext = createContext<RemoveLiquidityTxInfo | undefined>(undefined)

// The service quotes each side of the decrease (`DecreasePositionResponse.token0/token1`) from the position's
// live state. Use the quote only when it names the currency being removed (native ↔ zero address); a quoted
// zero is kept, since a drained position legitimately settles nothing.
function getQuotedAmount(quoted: LPToken | undefined, currency: Currency): CurrencyAmount<Currency> | undefined {
  if (!quoted?.amount || !areEvmAddressesEqual(quoted.tokenAddress, getTokenOrZeroAddress(currency))) {
    return undefined
  }
  return CurrencyAmount.fromRawAmount(currency, quoted.amount)
}

export function RemoveLiquidityTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const evmAddress = useActiveAddress(Platform.EVM)
  const { positionInfo, percent, currencies, committedDecrease } = useRemoveLiquidityModalContext()
  const delegatedAddress = useSelector((state: { delegation: DelegatedState }) =>
    positionInfo?.chainId ? state.delegation.delegations[String(positionInfo.chainId)] : null,
  )

  const removeLiquidityTxInfo = useRemoveLiquidityTxAndGasInfo({ account: evmAddress })
  const { approvalLoading, decreaseCalldataLoading, decreaseCalldata, error, refetch } = removeLiquidityTxInfo

  useEffect(() => {
    logContextUpdate('RemoveLiquidityTxContext', removeLiquidityTxInfo)
  }, [removeLiquidityTxInfo])

  const currency0 = currencies?.TOKEN0
  const currency1 = currencies?.TOKEN1

  // Prefer the service's quote: it is computed in the same call that builds the calldata (and is what the
  // calldata's minimums derive from). Until it lands, or when the service quotes no amounts, show the
  // displayed position's share.
  const { currency0AmountToRemove, currency1AmountToRemove } = useMemo((): Pick<
    RemoveLiquidityTxInfo,
    'currency0AmountToRemove' | 'currency1AmountToRemove'
  > => {
    if (!positionInfo || !currency0 || !currency1) {
      return {}
    }
    const { currency0Amount, currency1Amount } = positionInfo
    return {
      currency0AmountToRemove:
        getQuotedAmount(decreaseCalldata?.token0, currency0) ??
        CurrencyAmount.fromRawAmount(currency0, currency0Amount.quotient).multiply(percent).divide(100),
      currency1AmountToRemove:
        getQuotedAmount(decreaseCalldata?.token1, currency1) ??
        CurrencyAmount.fromRawAmount(currency1, currency1Amount.quotient).multiply(percent).divide(100),
    }
  }, [positionInfo, currency0, currency1, decreaseCalldata?.token0, decreaseCalldata?.token1, percent])

  const decreaseLiquidityTxContext = useMemo((): ValidatedDecreasePositionTxAndGasInfo | undefined => {
    if (
      !positionInfo ||
      approvalLoading ||
      decreaseCalldataLoading ||
      !decreaseCalldata ||
      !currency0AmountToRemove ||
      !currency1AmountToRemove
    ) {
      return undefined
    }
    const approvePositionTokenRequest = validateTransactionRequest(
      removeLiquidityTxInfo.v2LpTokenApproval?.positionTokenApproval,
    )
    const txRequest = validateTransactionRequest(decreaseCalldata.decrease)
    if (!txRequest) {
      return undefined
    }

    return {
      type: LiquidityTransactionType.Decrease,
      canBatchTransactions: false, // when batching is supported check canBatchTransactions
      delegatedAddress,
      action: {
        type: LiquidityTransactionType.Decrease,
        currency0Amount: currency0AmountToRemove,
        currency1Amount: currency1AmountToRemove,
        liquidityToken: positionInfo.liquidityToken,
      },
      approvePositionTokenRequest,
      txRequest,
      approveToken0Request: undefined,
      approveToken1Request: undefined,
      revokeToken0Request: undefined,
      revokeToken1Request: undefined,
      token0PermitTransaction: undefined,
      token1PermitTransaction: undefined,
      positionTokenPermitTransaction: undefined,
      permit: undefined,
    }
  }, [
    positionInfo,
    approvalLoading,
    decreaseCalldataLoading,
    decreaseCalldata,
    currency0AmountToRemove,
    currency1AmountToRemove,
    removeLiquidityTxInfo.v2LpTokenApproval?.positionTokenApproval,
    delegatedAddress,
  ])

  // After commit, hand out what the saga was given: a decrease quote that resolves late must not move the
  // review card. `txContext.action` carries the very amounts derived above, so reading them off it is the
  // same object either way.
  const txContext = committedDecrease?.txContext ?? decreaseLiquidityTxContext

  return (
    <RemoveLiquidityTxContext.Provider
      value={{
        ...removeLiquidityTxInfo,
        txContext,
        currency0AmountToRemove: txContext?.action.currency0Amount ?? currency0AmountToRemove,
        currency1AmountToRemove: txContext?.action.currency1Amount ?? currency1AmountToRemove,
        error,
        refetch,
      }}
    >
      {children}
    </RemoveLiquidityTxContext.Provider>
  )
}

export const useRemoveLiquidityTxContext = (): RemoveLiquidityTxInfo => {
  const removeContext = useContext(RemoveLiquidityTxContext)

  if (removeContext === undefined) {
    throw new Error('`useRemoveLiquidityTxContext` must be used inside of `RemoveLiquidityTxContextProvider`')
  }

  return removeContext
}
