import { Cli } from 'incur'

export const logout = Cli.create('logout', {
  description: 'Revoke Okta tokens and clear keychain entries.',
  run() {
    return { todo: 'logout' }
  },
})
