import { useEffect } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'

const MNEMONIC_TEST_ONLY = 'twist sad gauge frog divide reduce enact boy coconut fix student magnet'
export const DEMO_ACCOUNT_ADDRESS = '0xE1d494bC8690b1EF2F0A13B6672C4F2EE5c2D2B7'

export function useTestAccount() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(
      importAccountActions.trigger({
        type: ImportAccountType.Mnemonic,
        name: 'Demo Account',
        mnemonic: MNEMONIC_TEST_ONLY,
      })
    )
  }, [dispatch])
}
