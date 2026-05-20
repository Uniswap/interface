import { Cli } from 'incur'

export const login = Cli.create('login', {
  description: 'Authenticate via Okta Device Authorization Flow',
  run() {
    return { todo: 'login' }
  },
})
