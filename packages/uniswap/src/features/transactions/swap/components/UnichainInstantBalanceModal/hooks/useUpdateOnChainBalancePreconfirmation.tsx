import { BigNumber } from '@ethersproject/bignumber'
import noop from 'lodash/noop'
import { useEffect } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { getOnChainBalancesFetchWithPending } from 'uniswap/src/features/portfolio/api'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useIsTxLikelyPreconfirmed } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useIsTxPreconfirmed'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { useAcceptedTrade } from 'uniswap/src/features/transactions/swap/review/hooks/useAcceptedTrade'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { currencyIdToAddress, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { isValidHexString } from 'uniswap/src/utils/hex'
import { logger } from 'utilities/src/logger/logger'

export function useUpdateOnChainBalancePreconfirmation(): void {
  const { setScreen } = useTransactionModalContext()
  const accountAddress = useWallet().evmAccount?.address
  const { updateSwapForm, preSwapOutputBalance, postSwapDataPreserved, isSubmitting } = useSwapFormStore((s) => ({
    updateSwapForm: s.updateSwapForm,
    preSwapOutputBalance: s.preSwapDataPreserved?.outputBalanceRaw,
    postSwapDataPreserved: s.postSwapDataPreserved,
    isSubmitting: s.isSubmitting,
  }))

  const isTxConfirmed = useIsTxLikelyPreconfirmed()

  const { derivedSwapInfo, getExecuteSwapService } = useSwapDependenciesStore((s) => ({
    derivedSwapInfo: s.derivedSwapInfo,
    getExecuteSwapService: s.getExecuteSwapService,
  }))

  const { acceptedDerivedSwapInfo } = useAcceptedTrade({
    derivedSwapInfo,
    isSubmitting,
  })

  // get subblock time for chain info
  const subblockTimeMs = acceptedDerivedSwapInfo?.chainId
    ? getChainInfo(acceptedDerivedSwapInfo.chainId).subblockTimeMs
    : undefined

  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(acceptedDerivedSwapInfo?.chainId)

  useEffect((): (() => void) => {
    if (
      !isFlashblocksEnabled ||
      !isTxConfirmed ||
      !accountAddress ||
      !subblockTimeMs ||
      //  only fetch once
      postSwapDataPreserved
    ) {
      return noop
    }

    const { chainId, currencies } = acceptedDerivedSwapInfo || {}

    if (!chainId || !currencies?.output) {
      return noop
    }

    const newAddress = currencyIdToAddress(currencies.output.currencyId)

    if (!isValidHexString(newAddress)) {
      return noop
    }

    const currencyIsNative = isNativeCurrencyAddress(chainId, newAddress)

    const interval = setInterval(async () => {
      try {
        const { balance: newOutputBalance } = await getOnChainBalancesFetchWithPending({
          currencyAddress: newAddress,
          chainId,
          currencyIsNative,
          accountAddress,
        })
        if (!newOutputBalance || !currencies.output) {
          return
        }

        // only proceed if new balance > old balance
        if (BigNumber.from(newOutputBalance).lte(BigNumber.from(preSwapOutputBalance))) {
          return
        }

        updateSwapForm({
          postSwapDataPreserved: {
            currencyId: currencies.output.currencyId,
            outputBalanceRaw: newOutputBalance,
          },
        })
        setScreen(TransactionScreen.UnichainInstantBalance)
      } catch (error) {
        logger.error('Error fetching on-chain balance:', {
          tags: {
            file: 'useUpdateOnChainBalancePreconfirmation.tsx',
            function: 'useUpdateOnChainBalancePreconfirmation',
          },
        })
        return
      }
    }, subblockTimeMs / 2)

    return () => {
      clearInterval(interval)
    }
  }, [
    accountAddress,
    acceptedDerivedSwapInfo,
    updateSwapForm,
    getExecuteSwapService,

    subblockTimeMs,
    isFlashblocksEnabled,
    isTxConfirmed,
    preSwapOutputBalance,
    postSwapDataPreserved,
    setScreen,
  ])
}
