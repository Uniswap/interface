import { Currency } from '@uniswap/sdk-core'
import React, { useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { RecipientSelect } from 'src/components/RecipientSelect/RecipientSelect'
import { TokenSelector, TokenSelectorVariation } from 'src/components/TokenSelector/TokenSelector'
import { useSwapActionHandlers } from 'src/features/transactions/swap/hooks'
import { TransactionFlow } from 'src/features/transactions/TransactionFlow'
import {
  CurrencyField,
  initialState as emptyState,
  TransactionState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { useDerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import {
  createOnSelectRecipient,
  createOnToggleShowRecipientSelector,
} from 'src/features/transactions/transfer/utils'

interface TransferFormProps {
  prefilledState?: TransactionState
  onClose: () => void
}

export function TransferFlow({ prefilledState, onClose }: TransferFormProps) {
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const { t } = useTranslation()
  const { onSelectCurrency, onHideTokenSelector } = useSwapActionHandlers(dispatch)
  const onSelectRecipient = createOnSelectRecipient(dispatch)
  const onToggleShowRecipientSelector = createOnToggleShowRecipientSelector(dispatch)
  const derivedTransferInfo = useDerivedTransferInfo(state)

  return (
    <TransactionFlow
      derivedInfo={derivedTransferInfo}
      dispatch={dispatch}
      flowName={t('Send')}
      recipientSelector={
        <RecipientSelect
          recipient={state.recipient}
          onSelectRecipient={onSelectRecipient}
          onToggleShowRecipientSelector={onToggleShowRecipientSelector}
        />
      }
      showRecipientSelector={state.showRecipientSelector}
      showTokenSelector={!!state.selectingCurrencyField}
      tokenSelector={
        <TokenSelector
          variation={TokenSelectorVariation.BalancesOnly}
          onBack={onHideTokenSelector}
          onSelectCurrency={(currency: Currency) => onSelectCurrency(CurrencyField.INPUT, currency)}
        />
      }
      onClose={onClose}
    />
  )
}
