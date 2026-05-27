import { Cli } from 'incur'
import { vars } from '../vars'

export const whoami = Cli.create('whoami', {
  description: 'Show the currently authenticated Okta user and access token expiry.',
  async run(c) {
    const { keychain } = vars(c)

    const stored = await keychain.readTokens()
    if (stored.isErr()) {
      // Read failure here almost always means "no tokens stored" (the user has never run
      // login, or ran logout). Surface a clean prompt rather than a raw KeychainError.
      return c.error({
        code: 'NotLoggedIn',
        message: `Not logged in. Run login to authenticate. (${stored.error.message})`,
      })
    }

    const { email, expiry } = stored.value
    return {
      email,
      expiresAt: new Date(expiry).toISOString(),
      expired: Date.now() >= expiry,
    }
  },
})
