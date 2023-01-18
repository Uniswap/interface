import { AnyAction } from '@reduxjs/toolkit'
import {
  selectRecipient,
  toggleShowRecipientSelector,
} from 'src/features/transactions/transactionState/transactionState'

export const createOnToggleShowRecipientSelector =
  (dispatch: React.Dispatch<AnyAction>) => (): void =>
    dispatch(toggleShowRecipientSelector)

export const createOnSelectRecipient = (dispatch: React.Dispatch<AnyAction>) => {
  return (recipient: Address): void => {
    createOnToggleShowRecipientSelector(dispatch)()
    dispatch(selectRecipient({ recipient }))
  }
}
