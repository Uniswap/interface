import React from 'react'
import { TokenSelector } from 'src/features/transactions/swapRewrite/TokenSelector'
import { Text } from 'ui/src'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { useTransactionModalContext } from 'wallet/src/features/transactions/contexts/TransactionModalContext'
import { TransactionModalInnerContainer } from 'wallet/src/features/transactions/swap/TransactionModal'

export function TransferFormScreen({ hideContent }: { hideContent: boolean }): JSX.Element {
  const { handleContentLayout, bottomSheetViewStyles } = useTransactionModalContext()
  const { selectingCurrencyField } = useSwapFormContext()

  return (
    <TransactionModalInnerContainer
      fullscreen
      bottomSheetViewStyles={bottomSheetViewStyles}
      onLayout={handleContentLayout}>
      {!hideContent && !!selectingCurrencyField && <TokenSelector />}
      <Text color="$DEP_accentWarning" variant="subheading2">
        TODO: transfer form content
      </Text>
    </TransactionModalInnerContainer>
  )
}
