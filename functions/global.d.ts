import { setup } from 'jest-dev-server'

declare global {
  // eslint-disable-next-line no-var
  var servers: Awaited<ReturnType<typeof setup>>
}
