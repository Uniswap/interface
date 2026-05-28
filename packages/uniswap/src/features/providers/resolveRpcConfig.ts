import type { RpcConfigResolver } from '@universe/chains'
import { PlatformSplitStubError } from 'utilities/src/errors'

// Platform-agnostic re-exports — these stay on the base file because they have
// no platform-specific behavior. The implementations are in `.web.ts` (web +
// extension) and `.native.ts` (mobile); bundlers pick one at build time.
// TODO: migrate consumers to import from @universe/chains directly
export { createRpcConfigResolver } from '@universe/chains'
export type { RpcConfigResolver, RpcConfigResolverInput } from '@universe/chains'

export const defaultResolveRpcConfig: RpcConfigResolver = () => {
  throw new PlatformSplitStubError('defaultResolveRpcConfig')
}
