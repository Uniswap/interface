import { Cli } from 'incur'
import { unwrap } from '../errors'
import { vars } from '../vars'

export const logout = Cli.create('logout', {
  description: 'Revoke Okta tokens and clear keychain entries.',
  async run(c) {
    const { okta, keychain } = vars(c)

    // Best-effort token read: if there's nothing in the keychain (already logged out, or
    // keychain access broken), there's nothing to revoke — fall through to clearTokens,
    // which is idempotent and will leave us in the desired "logged out" state regardless.
    const stored = await keychain.readTokens()

    // Collect remote-revocation failures rather than aborting. The user's intent is
    // "log me out locally" — a network blip or upstream Okta error shouldn't leave them
    // with stale tokens on disk.
    const revokeWarnings: string[] = []
    if (stored.isOk()) {
      // Revoke refresh first: it also invalidates the access tokens derived from it
      // (Okta cascades the revocation). Revoking access separately is belt-and-suspenders
      // for the case where the refresh revoke failed.
      const refreshRevoke = await okta.revokeToken(stored.value.refreshToken, 'refresh_token')
      if (refreshRevoke.isErr()) {
        revokeWarnings.push(`refresh_token: ${refreshRevoke.error.message}`)
      }
      const accessRevoke = await okta.revokeToken(stored.value.accessToken, 'access_token')
      if (accessRevoke.isErr()) {
        revokeWarnings.push(`access_token: ${accessRevoke.error.message}`)
      }
    }

    await unwrap(keychain.clearTokens())

    return {
      loggedOut: true,
      ...(stored.isOk() && { email: stored.value.email }),
      ...(revokeWarnings.length > 0 && { warnings: revokeWarnings }),
    }
  },
})
