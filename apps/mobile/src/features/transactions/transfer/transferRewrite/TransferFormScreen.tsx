import React from 'react'
import { Text } from 'ui/src'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { useTransactionModalContext } from 'wallet/src/features/transactions/contexts/TransactionModalContext'
import { TransactionModalInnerContainer } from 'wallet/src/features/transactions/swap/TransactionModal'

export function TransferFormScreen({ hideContent }: { hideContent: boolean }): JSX.Element {
  const { bottomSheetViewStyles } = useTransactionModalContext()
  const { selectingCurrencyField } = useSwapFormContext()

  return (
    <TransactionModalInnerContainer fullscreen bottomSheetViewStyles={bottomSheetViewStyles}>
      {!hideContent && !!selectingCurrencyField && <TokenSelector />}
      <Text color="$DEP_accentWarning" variant="subheading2">
        TODO: transfer form content
      </Text>
    </TransactionModalInnerContainer>
  )
}

function TokenSelector(): JSX.Element | null {
  // TODO: implement. See `wallet/.../SwapTokenSelector.tsx` for reference.
  return null
}
