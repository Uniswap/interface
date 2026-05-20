import { Cli } from 'incur'
import { login } from './commands/login'
import { logout } from './commands/logout'
import { pull } from './commands/pull'
import { unzip } from './commands/unzip'
import { view } from './commands/view'
import { zip } from './commands/zip'

export const cli = Cli.create('config-cli', {
  version: '0.0.0',
  description: 'Authenticate with Okta and fetch app configs from the Config Service.',
})
  .command(login)
  .command(logout)
  .command(view)
  .command(pull)
  .command(zip)
  .command(unzip)
