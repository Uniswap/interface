import { useWeb3React } from '@web3-react/core'
import { valora } from 'connectors'
import { useEffect } from 'react'
import { useValoraAccount } from 'state/user/hooks'

import { ValoraConnector } from './ValoraConnector'

/**
 * useValora handles incoming valora requests
 */
export const useValora = () => {
  const { activate, account: injectedAccount, connector } = useWeb3React()
  const { account: savedValoraAccount } = useValoraAccount()

  useEffect(() => {
    if (!(connector instanceof ValoraConnector)) {
      return
    }
    if (!injectedAccount && savedValoraAccount) {
      valora.setSavedValoraAccount(savedValoraAccount)
      activate(valora, undefined, true)
    }
  }, [connector, injectedAccount, savedValoraAccount, activate])
}
