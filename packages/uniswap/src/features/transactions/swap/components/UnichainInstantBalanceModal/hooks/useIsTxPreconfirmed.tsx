import noop from 'lodash/noop'
import { useEffect, useState } from 'react'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { getOnChainBalancesFetchWithPending } from 'uniswap/src/features/portfolio/api'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'

const SUBBLOCK_PING_INTERVAL = 100

export function useIsTxLikelyPreconfirmed(): boolean {
  const accountAddress = useWallet().evmAccount?.address
  const isConfirmed = useSwapFormStore((s) => s.isConfirmed)

  const {
    derivedSwapInfo: { currencies, chainId },
  } = useSwapDependenciesStore((s) => ({ derivedSwapInfo: s.derivedSwapInfo }))
  const outputCurrencyInfo = currencies[CurrencyField.OUTPUT]

  const [hasBalanceChanged, setHasBalanceChanged] = useState(false)

  const initialNativeBalance = useSwapFormStore((s) => s.preSwapNativeAssetAmountRaw)
  useEffect(() => {
    // only fetch if there's a confirmed tx
    if (!isConfirmed) {
      return noop
    }

    if (!initialNativeBalance) {
      return noop
    }

    if (hasBalanceChanged) {
      return noop
    }

    if (outputCurrencyInfo?.currency.isNative) {
      return noop
    }

    if (!outputCurrencyInfo?.currencyId) {
      return noop
    }

    if (!accountAddress) {
      return noop
    }

    const interval = setInterval(async () => {
      const { balance: currentNativeBalance } = await getOnChainBalancesFetchWithPending({
        currencyAddress: getNativeAddress(chainId),
        chainId,
        currencyIsNative: true,
        accountAddress,
      })

      if (currentNativeBalance && currentNativeBalance !== initialNativeBalance) {
        setHasBalanceChanged(true)
      }
    }, SUBBLOCK_PING_INTERVAL)
    return () => clearInterval(interval)
  }, [
    initialNativeBalance,
    outputCurrencyInfo?.currencyId,
    outputCurrencyInfo?.currency.isNative,
    accountAddress,
    chainId,
    hasBalanceChanged,
    isConfirmed,
  ])

  return hasBalanceChanged
}
