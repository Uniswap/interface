// `@universe/api/fetch`: the shared fetch client without the root barrel's Apollo graph.
export { createFetchClient } from '@universe/api/src/clients/base/createFetchClient'
export { FetchError } from '@universe/api/src/clients/base/errors'
export type {
  CustomOptions,
  FetchClient,
  FetchClientContext,
  StandardFetchOptions,
} from '@universe/api/src/clients/base/types'
