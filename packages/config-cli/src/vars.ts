import { z } from 'incur'
import type { AuthService } from './services/auth'
import type { KeychainService } from './services/keychain'
import type { OktaClient } from './services/okta'

/**
 * "Vars" is incur's dependency-injection mechanism: a typed bag of runtime values that
 * middleware populates via `c.set('key', value)` and command handlers read via `c.var.key`.
 * Use it for services and clients that need to be constructed once at startup (Okta client,
 * Keychain wrapper) and reused across commands.
 *
 * incur recognizes four kinds of typed input per command:
 *   - args     positional CLI arguments (`c.args`)
 *   - options  flags like `--foo bar` (`c.options`)
 *   - env      validated process.env (`c.env`)
 *   - vars     these values set by middleware at runtime (`c.var`)
 */
export const appVars = z.object({
  okta: z.custom<OktaClient>(),
  keychain: z.custom<KeychainService>(),
  auth: z.custom<AuthService>(),
})

export type AppVars = z.infer<typeof appVars>

/**
 * Helper to access typed vars inside command handlers.
 */
export function vars(c: { var: object }): AppVars {
  return c.var as AppVars
}
