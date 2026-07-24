import { Cli } from 'incur'
import { unwrap } from '../errors'
import { vars } from '../vars'

export const login = Cli.create('login', {
  description: 'Authenticate via Okta Device Authorization Flow.',
  async run(c) {
    const { auth } = vars(c)

    const { email, expiry } = await unwrap(auth.login())

    return { email, expiresAt: new Date(expiry).toISOString() }
  },
})
