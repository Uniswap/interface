import React, { useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { initialSwapFormState, swapFormReducer } from 'src/features/swap/swapFormSlice'
import { TransferTokenForm } from 'src/features/transfer/TransferTokenForm'
import { Screens } from 'src/screens/Screens'
import { SheetWithNetworkSelector } from 'src/screens/SwapScreen'

export function TransferTokenScreen({ route }: AppStackScreenProp<Screens.Transfer>) {
  // TODO: generalize swap form reducer
  const [state, dispatch] = useReducer(
    swapFormReducer,
    route.params?.swapFormState || initialSwapFormState
  )

  const { t } = useTranslation()

  return (
    <SheetWithNetworkSelector dispatch={dispatch} label={t('Send')} state={state}>
      <TransferTokenForm dispatch={dispatch} state={state} />
    </SheetWithNetworkSelector>
  )
}
