import React, { useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { AppStackScreenProp } from 'src/app/navigation/types'
import {
  initialState,
  TransactionState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { TransferTokenForm } from 'src/features/transactions/transfer/TransferTokenForm'
import { Screens } from 'src/screens/Screens'
import { SheetScreenWithHeader } from 'src/screens/SwapScreen'

export function TransferTokenScreen({ route }: AppStackScreenProp<Screens.Transfer>) {
  const [state, dispatch] = useReducer(
    transactionStateReducer,
    route.params?.transferFormState || initialState
  )

  const { t } = useTranslation()

  return (
    <SheetScreenWithHeader label={t('Send')} state={state}>
      <TransferTokenForm dispatch={dispatch} state={state as TransactionState} />
    </SheetScreenWithHeader>
  )
}
