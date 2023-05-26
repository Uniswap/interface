import { appSelect } from 'wallet/src/state'
import { getSortedActiveChainIds } from './utils'

export function* selectActiveChainIds() {
  const chains = yield* appSelect((s) => s.chains.byChainId)
  return getSortedActiveChainIds(chains)
}
