import { useCallback } from 'react'
import { Flex, useExtractedTokenColor, useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { useEarnMainnetActionCurrencyForToken } from 'uniswap/src/features/earn/hooks/useEarnMainnetActionCurrency'
import { YouNeedTokenView } from 'uniswap/src/features/earn/YouNeedTokenView'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'

// Route param fields must be optional — the generic ReactNavigationModal wrapper can't
// narrow ModalName correctly when any entry has a required field.
export type EarnYouNeedTokenModalProps = {
  currencyId?: string
}

export function EarnYouNeedTokenModal({
  currencyId,
  isOpen,
  onClose,
}: EarnYouNeedTokenModalProps & BaseModalProps): JSX.Element | null {
  const colors = useSporeColors()
  const { navigateToSwapFlow, navigateToFiatOnRamp } = useWalletNavigation()
  const currencyInfo = useCurrencyInfo(currencyId)
  const symbol = currencyInfo?.currency.symbol ?? ''
  const { actionsDisabled, currencyInfoForActions } = useEarnMainnetActionCurrencyForToken({ currencyId })

  const { tokenColor } = useExtractedTokenColor({
    imageUrl: currencyInfo?.logoUrl,
    tokenName: currencyInfo?.currency.name,
    backgroundColor: colors.surface1.val,
    defaultColor: colors.accent1.val,
  })

  const handleSwapForToken = useCallback(() => {
    if (!currencyInfoForActions) {
      return
    }
    onClose()
    navigateToSwapFlow({
      currencyField: CurrencyField.OUTPUT,
      currencyAddress: currencyIdToAddress(currencyInfoForActions.currencyId),
      currencyChainId: currencyInfoForActions.currency.chainId,
      origin: ModalName.EarnYouNeedToken,
    })
  }, [currencyInfoForActions, navigateToSwapFlow, onClose])

  const handleBuyWithCash = useCallback(() => {
    if (!currencyInfoForActions) {
      return
    }
    onClose()
    navigateToFiatOnRamp({
      prefilledCurrency: { currencyInfo: currencyInfoForActions },
    })
  }, [currencyInfoForActions, navigateToFiatOnRamp, onClose])

  if (!currencyId) {
    return null
  }

  return (
    <Modal name={ModalName.EarnYouNeedToken} isModalOpen={isOpen} onClose={onClose}>
      <Flex gap="$spacing16" px="$spacing16" pb="$spacing16">
        <YouNeedTokenView
          currencyInfo={currencyInfo}
          symbol={symbol}
          tokenColor={tokenColor ?? colors.accent1.val}
          actionsDisabled={actionsDisabled}
          onBack={onClose}
          onClose={onClose}
          onSwapForToken={handleSwapForToken}
          onBuyWithCash={handleBuyWithCash}
        />
      </Flex>
    </Modal>
  )
}
