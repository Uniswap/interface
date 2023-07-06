import { SpawndChildProcess } from 'spawnd'

declare global {
  // eslint-disable-next-line no-var
  var servers: SpawndChildProcess[]
}
