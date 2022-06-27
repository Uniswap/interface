import { useCallback } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { Account } from 'src/features/wallet/accounts/types'
import { editAccount } from 'src/features/wallet/walletSlice'

export function useUpdateColorCallback() {
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
                ...(activeAccount?.customizations?.palette ?? {
                  deprecated_secondary1: 'deprecated_secondary1',
                  deprecated_background1: 'deprecated_background1',
                  deprecated_textColor: 'deprecated_textColor',
                }),
                deprecated_primary1: color || 'deprecated_primary1',
              },
            },
          },
        })
      )
    },
    [dispatch]
  )
}
