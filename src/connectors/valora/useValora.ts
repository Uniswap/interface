import { useWeb3React } from '@web3-react/core'
import { valora } from 'connectors'
import { useEffect } from 'react'
import { useValoraAccount } from 'state/user/hooks'

/**
 * useValora handles incoming valora requests
 */
export const useValora = () => {
  const { activate, account: injectedAccount } = useWeb3React()
  const { account: savedValoraAccount } = useValoraAccount()

  useEffect(() => {
    console.log({ injectedAccount, savedValoraAccount })
    if (!injectedAccount && savedValoraAccount) {
      valora.setSavedValoraAccount(savedValoraAccount)
      activate(valora, undefined, true)
    }
  }, [injectedAccount, savedValoraAccount, activate])
}
