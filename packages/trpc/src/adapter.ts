/**
 * Unified tRPC API adapter factories.
 *
 * Apps define a `TrpcApi` interface (routers of async procedures) that works
 * identically with server-side callers (SSR loaders) and the browser tRPC
 * client (components). These factories build the runtime adapters from a
 * declarative shape map, replacing hand-written per-procedure wrappers.
 *
 * No tRPC dependency — callers and clients are typed structurally.
 *
 * @example
 * ```typescript
 * import { createTrpcApiFromCaller, createTrpcApiFromClient, type TrpcApiShape } from '@universe/trpc'
 *
 * const trpcApiShape = {
 *   apiKey: { list: 'query', create: 'mutation' },
 * } as const satisfies TrpcApiShape<TrpcApi>
 *
 * const serverApi = createTrpcApiFromCaller<TrpcApi>(createCaller(ctx), trpcApiShape)
 * const clientApi = createTrpcApiFromClient<TrpcApi, typeof trpcApiShape>(trpc, trpcApiShape)
 * ```
 */

/** How a procedure is invoked on a tRPC client: `.query()` or `.mutate()`. */
export type TrpcProcedureKind = 'query' | 'mutation'

/**
 * Constraint for a unified API: routers of async procedures.
 * Self-referential so app-defined interfaces (which have no index signature) satisfy it.
 */
export type TrpcApiBase<TApi> = {
  [R in keyof TApi]: {
    [P in keyof TApi[R]]: (input: never) => Promise<unknown>
  }
}

/**
 * Runtime description of a `TrpcApi`: every procedure classified as query or mutation.
 * Declare it `as const satisfies TrpcApiShape<TrpcApi>` so the kinds stay literal —
 * that is what lets `TrpcClientLike` verify the classification against the real client.
 */
export type TrpcApiShape<TApi> = {
  [R in keyof TApi]: {
    [P in keyof TApi[R]]: TrpcProcedureKind
  }
}

/**
 * The client shape required for a given api + shape. Where the shape says `query`,
 * the client must expose a matching `.query()` (likewise `.mutate()` for mutations),
 * so misclassifying a procedure in the shape map is a compile error.
 */
export type TrpcClientLike<TApi, TShape extends TrpcApiShape<TApi>> = {
  [R in keyof TApi & keyof TShape]: {
    [P in keyof TApi[R] & keyof TShape[R]]: TShape[R][P] extends 'query'
      ? { query: TApi[R][P] }
      : { mutate: TApi[R][P] }
  }
}

/**
 * Untyped runtime views of the generic inputs. `TApi`, `TrpcApiShape<TApi>`, and
 * `TrpcClientLike<TApi, TShape>` are each directly assignable to one of these
 * (plain checked assignments, no casts), which lets the builder iterate them
 * with ordinary string keys.
 */
type AnyProcedure = (input: never) => Promise<unknown>
type UntypedShape = Record<string, Record<string, TrpcProcedureKind>>
type UntypedRecord<T> = Record<string, Record<string, T>>
/** A client procedure exposes `.query()` or `.mutate()` depending on its kind. */
interface ClientProcedureLike {
  query?: AnyProcedure
  mutate?: AnyProcedure
}

interface ProcedurePath {
  routerName: string
  procedureName: string
  kind: TrpcProcedureKind
}

function getMember<T>(record: UntypedRecord<T>, path: ProcedurePath): T {
  const member = record[path.routerName]?.[path.procedureName]
  if (member === undefined) {
    throw new Error(`Unknown tRPC procedure: ${path.routerName}.${path.procedureName}`)
  }
  return member
}

function buildAdapter(
  shape: UntypedShape,
  createProcedure: (path: ProcedurePath) => AnyProcedure,
): UntypedRecord<AnyProcedure> {
  const api: UntypedRecord<AnyProcedure> = {}
  for (const [routerName, procedures] of Object.entries(shape)) {
    const adapterRouter: Record<string, AnyProcedure> = {}
    for (const [procedureName, kind] of Object.entries(procedures)) {
      adapterRouter[procedureName] = createProcedure({ routerName, procedureName, kind })
    }
    api[routerName] = adapterRouter
  }
  return api
}

/**
 * Builds a `TrpcApi` from a server-side caller (`createCaller(ctx)`).
 * Each procedure invokes the caller in-process — zero HTTP, for SSR loaders.
 */
export function createTrpcApiFromCaller<TApi extends TrpcApiBase<TApi>>(caller: TApi, shape: TrpcApiShape<TApi>): TApi {
  const untypedCaller: UntypedRecord<AnyProcedure> = caller
  const api = buildAdapter(shape, (path) => (input) => getMember(untypedCaller, path)(input))
  // Sole assertion: TypeScript cannot relate a record built by iterating string keys
  // back to the generic TApi. `shape: TrpcApiShape<TApi>` guarantees the built keys
  // mirror TApi exactly.
  return api as TApi
}

/**
 * Builds a `TrpcApi` from a browser tRPC client, dispatching each procedure
 * to `.query()` or `.mutate()` per the shape map.
 */
export function createTrpcApiFromClient<TApi extends TrpcApiBase<TApi>, TShape extends TrpcApiShape<TApi>>(
  client: TrpcClientLike<TApi, TShape>,
  shape: TShape,
): TApi {
  const untypedClient: UntypedRecord<ClientProcedureLike> = client
  const api = buildAdapter(shape, (path) => (input) => {
    const procedure = getMember(untypedClient, path)
    const method = path.kind === 'query' ? procedure.query : procedure.mutate
    if (method === undefined) {
      throw new Error(`tRPC procedure ${path.routerName}.${path.procedureName} does not support '${path.kind}'`)
    }
    return method(input)
  })
  // Sole assertion — see createTrpcApiFromCaller.
  return api as TApi
}
