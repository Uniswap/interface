import { useEffect } from 'react'
import { getOnChainBalancesFetchWithPending } from 'uniswap/src/features/portfolio/api'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'

// Simple hook to track initial output balance when review opens
export function usePreserveInitialSwapData(): void {
  const accountAddress = useWallet().evmAccount?.address

  const { derivedSwapInfo } = useSwapDependenciesStore((s) => ({ derivedSwapInfo: s.derivedSwapInfo }))
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)
  const preSwapDataPreserved = useSwapFormStore((s) => s.preSwapDataPreserved)

  const outputCurrencyInfo = derivedSwapInfo.currencies[CurrencyField.OUTPUT]
  const outputBalance = derivedSwapInfo.currencyBalances[CurrencyField.OUTPUT]

  useEffect(() => {
    // native output swaps can be tracked as is
    if (outputCurrencyInfo?.currency.isNative) {
      return
    }

    if (!outputCurrencyInfo?.currencyId) {
      return
    }

    if (!accountAddress) {
      return
    }

    getOnChainBalancesFetchWithPending({
      currencyAddress: outputCurrencyInfo.currencyId,
      chainId: derivedSwapInfo.chainId,
      currencyIsNative: true,
      accountAddress,
    })
      .then(({ balance: nativeBalance }) => {
        updateSwapForm({
          preSwapNativeAssetAmountRaw: nativeBalance,
        })
      })
      .catch((error) => {
        logger.error(error, {
          tags: { file: 'usePreserveInitialSwapData.tsx', function: 'usePreserveInitialSwapData' },
        })
      })
  }, [
    outputCurrencyInfo?.currencyId,
    derivedSwapInfo.chainId,
    accountAddress,
    updateSwapForm,
    outputCurrencyInfo?.currency.isNative,
  ])

  useEffect(() => {
    // if there's an existing pre-swap output balance, don't override (eg don't replace with new balance)
    if (
      preSwapDataPreserved?.outputBalanceRaw !== undefined &&
      preSwapDataPreserved.currencyId === outputCurrencyInfo?.currencyId
    ) {
      return
    }

    if (outputCurrencyInfo?.currencyId && outputBalance && derivedSwapInfo.currencyAmounts[CurrencyField.OUTPUT]) {
      updateSwapForm({
        preSwapDataPreserved: {
          currencyId: outputCurrencyInfo.currencyId,
          outputBalanceRaw: outputBalance.quotient.toString(),
          preSwapOutputAmountEstimateExact: derivedSwapInfo.currencyAmounts[CurrencyField.OUTPUT].toExact(),
        },
      })
    }
  }, [outputCurrencyInfo, outputBalance, preSwapDataPreserved, updateSwapForm, derivedSwapInfo.currencyAmounts])
}
