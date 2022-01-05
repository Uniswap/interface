import { useEffect } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'

const MNEMONIC_TEST_ONLY = 'twist sad gauge frog divide reduce enact boy coconut fix student magnet'

export function useTestAccount() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(
      importAccountActions.trigger({
        type: ImportAccountType.Mnemonic,
        name: 'Test Account',
        mnemonic: MNEMONIC_TEST_ONLY,
      })
    )
  }, [dispatch])
}
