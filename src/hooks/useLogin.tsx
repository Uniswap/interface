import KyberOauth2 from '@kybernetwork/oauth2'
import { useEffect } from 'react'

import { OAUTH_CLIENT_ID } from 'constants/env'

const useLogin = () => {
  useEffect(() => {
    const signIn = async function signIn() {
      try {
        const clientAppConfig = { clientId: OAUTH_CLIENT_ID }
        KyberOauth2.initialize(clientAppConfig)
        await KyberOauth2.loginAnonymous()
      } catch (error) {
        console.log('get info anonymous err', error)
      }
    }
    signIn()
  }, [])
}
export default useLogin
