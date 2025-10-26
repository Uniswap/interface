import { TradingApi } from '@universe/api'
import { useMemo } from 'react'

import { useTokenApprovalInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import { getUniswapXSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/uniswapx/utils'
import {
  getBridgeSwapTxAndGasInfo,
  getClassicSwapTxAndGasInfo,
  getFallbackSwapTxAndGasInfo,
  getWrapTxAndGasInfo,
  usePermitTxInfo,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { useTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/hooks/useTransactionRequestInfo'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { CurrencyField } from 'uniswap/src/types/currency'

/** @deprecated Delete when ServiceBasedSwapTransactionInfo is fully rolled out */
export function useSwapTxAndGasInfo({
  derivedSwapInfo,
  account,
}: {
  derivedSwapInfo: DerivedSwapInfo
  account?: AccountDetails
}): SwapTxAndGasInfo {
  const {
    chainId,
    wrapType,
    currencyAmounts,
    trade: { trade },
  } = derivedSwapInfo

  const approvalTxInfo = useTokenApprovalInfo({
    account,
    chainId,
    wrapType,
    currencyInAmount: currencyAmounts[CurrencyField.INPUT],
    currencyOutAmount: currencyAmounts[CurrencyField.OUTPUT],
    routing: trade?.routing,
  })
  const { tokenApprovalInfo } = approvalTxInfo

  // TODO(MOB-3425) decouple wrap tx from swap tx to simplify UniswapX code
  const swapTxInfo = useTransactionRequestInfo({
    derivedSwapInfo,
    tokenApprovalInfo,
  })

  const permitTxInfo = usePermitTxInfo({ quote: trade?.quote })

  return useMemo(() => {
    switch (trade?.routing) {
      case TradingApi.Routing.DUTCH_V2:
      case TradingApi.Routing.DUTCH_V3:
      case TradingApi.Routing.PRIORITY:
        return getUniswapXSwapTxAndGasInfo({ trade, swapTxInfo, approvalTxInfo })
      case TradingApi.Routing.BRIDGE:
        return getBridgeSwapTxAndGasInfo({ trade, swapTxInfo, approvalTxInfo })
      case TradingApi.Routing.CLASSIC:
        return getClassicSwapTxAndGasInfo({ trade, swapTxInfo, approvalTxInfo, permitTxInfo })
      case TradingApi.Routing.WRAP:
      case TradingApi.Routing.UNWRAP:
        return getWrapTxAndGasInfo({ trade, swapTxInfo })
      default:
        return getFallbackSwapTxAndGasInfo({ swapTxInfo, approvalTxInfo })
    }
  }, [approvalTxInfo, permitTxInfo, swapTxInfo, trade])
}
