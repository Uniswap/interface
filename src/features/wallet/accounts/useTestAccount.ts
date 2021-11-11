import { useEffect } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { useAccounts } from 'src/features/wallet/hooks'

const MNEMONIC_TEST_ONLY = 'twist sad gauge frog divide reduce enact boy coconut fix student magnet'
const ADDRESS_TEST_ONLY = '0xE1d494bC8690b1EF2F0A13B6672C4F2EE5c2D2B7'

export function useTestAccount() {
  const dispatch = useAppDispatch()
  const accounts = useAccounts()

  useEffect(() => {
    if (accounts[ADDRESS_TEST_ONLY]) {
      return
    }

    dispatch(
      importAccountActions.trigger({
        name: 'Test Account',
        mnemonic: MNEMONIC_TEST_ONLY,
      })
    )
  }, [accounts, dispatch])
}
