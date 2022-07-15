import { useCallback } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { Account } from 'src/features/wallet/accounts/types'
import { editAccount } from 'src/features/wallet/walletSlice'

export function useUpdateColorCallback() {
  // TODO: update DynamicThemeProvider
  const dispatch = useAppDispatch()
  return useCallback(
    (activeAccount: Account, color?: string) => {
      dispatch(
        editAccount({
          address: activeAccount.address,
          updatedAccount: {
            ...activeAccount,
            customizations: {
              ...activeAccount.customizations,
              palette: {
                userThemeColor: color || 'userThemeColor',
              },
            },
          },
        })
      )
    },
    [dispatch]
  )
}
