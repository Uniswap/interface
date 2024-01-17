import React from 'react'
import { useSwapFormContext } from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import { useTransactionModalContext } from 'src/features/transactions/swapRewrite/contexts/TransactionModalContext'
import { TokenSelector } from 'src/features/transactions/swapRewrite/TokenSelector'
import { TransactionModalInnerContainer } from 'src/features/transactions/swapRewrite/TransactionModal'
import { Text } from 'ui/src'

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
