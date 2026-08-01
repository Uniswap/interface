import { Cli } from 'incur'
import { approve } from './commands/approve'
import { del } from './commands/delete'
import { login } from './commands/login'
import { logout } from './commands/logout'
import { pull } from './commands/pull'
import { push } from './commands/push'
import { syncDev } from './commands/sync-dev'
import { unzip } from './commands/unzip'
import { view } from './commands/view'
import { whoami } from './commands/whoami'
import { zip } from './commands/zip'
import { createAuthService } from './services/auth'
import { createKeychainService } from './services/keychain'
import { createOktaClient } from './services/oktaClient'
import { appVars } from './vars'

export const cli = Cli.create('config-cli', {
  version: '0.0.0',
  description: 'Authenticate with Okta and fetch app configs from the Config Service.',
  vars: appVars,
})
  .use(async (c, next) => {
    const okta = createOktaClient()
    const keychain = createKeychainService()
    c.set('okta', okta)
    c.set('keychain', keychain)
    c.set('auth', createAuthService({ keychain, okta }))
    await next()
  })
  .command(login)
  .command(logout)
  .command(whoami)
  .command(view)
  .command(pull)
  .command(push)
  .command(syncDev)
  .command(approve)
  .command(del)
  .command(zip)
  .command(unzip)
