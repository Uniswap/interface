/* biome-ignore-all lint/suspicious/noExplicitAny: legacy code needs review */
import { GraphQLApi } from '@universe/api'
import cloneDeepWith from 'lodash/cloneDeepWith'

type UndefinedToNull<T> = T extends undefined ? null : T

type ResolverReturnType<T> = T extends (...args: any[]) => infer TResult
  ? TResult
  : T extends { resolve: (...args: any[]) => infer TResult }
    ? TResult
    : never

type ResolverParameters<T extends GraphQLApi.Resolver<any, any, any, any>> = T extends GraphQLApi.ResolverWithResolve<
  infer TResult, // only result type is needed to filter selected fields
  any,
  any,
  any
>
  ? Parameters<GraphQLApi.ResolverFn<TResult, any, any, any>>
  : T extends GraphQLApi.ResolverFn<infer TResult, any, any, any>
    ? Parameters<GraphQLApi.ResolverFn<TResult, any, any, any>>
    : never

type ResolverResponses<T extends GraphQLApi.QueryResolvers> = {
  [K in keyof T]: Promise<ResolverReturnType<T[K]>>
}

function isResolverWithResolve<T extends GraphQLApi.Resolver<any, any, any, any>>(
  resolver: T,
): resolver is Extract<T, GraphQLApi.ResolverWithResolve<any, any, any, any>> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return typeof resolver === 'object' && resolver !== null && 'resolve' in resolver
}

function isResolverFunction<T extends GraphQLApi.Resolver<any, any, any, any>>(
  resolver: T,
): resolver is Extract<T, GraphQLApi.ResolverFn<any, any, any, any>> {
  return typeof resolver === 'function'
}

export function queryResolvers<T extends GraphQLApi.QueryResolvers>(
  resolvers: T,
): {
  resolved: ResolverResponses<T>
  resolvers: { Query: T }
} {
  // Create a response object with functions to create and resolve promises
  const promiseResolvers = {} as Record<keyof T, (value: any) => void>
  const resolved = Object.fromEntries(
    Object.keys(resolvers).map((key) => [key, new Promise((resolve) => (promiseResolvers[key as keyof T] = resolve))]),
  ) as ResolverResponses<T>

  return {
    resolved,
    resolvers: {
      Query: Object.fromEntries(
        Object.entries(resolvers).map(([k, resolver]) => {
          const key = k as keyof T
          type R = typeof resolver

          const resolve = async (...params: ResolverParameters<R>): Promise<ResolverReturnType<R>> => {
            const [parent, args, context, info] = params

            const resolvedValue = isResolverWithResolve(resolver)
              ? resolver.resolve(parent, args, context, info)
              : isResolverFunction(resolver)
                ? resolver(parent, args, context, info)
                : null

            // TODO(WALL-5157): This was commented out because it breaks when using fragments.
            //                  To fix it, we need to recursively filter nested fields when fragments are used.
            // const updatedValue = await filterObjectFields(info.fieldNodes[0]?.selectionSet, resolvedValue)

            // cloneDeepWith returns any type so we need to cast it manually
            const resultObj = cloneDeepWith(resolvedValue, undefinedToNull) as ResolverReturnType<R>

            // Resolve the corresponding promise
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (promiseResolvers[key]) {
              promiseResolvers[key](resultObj)
            }

            return resultObj
          }

          return [key, resolve]
        }),
      ) as unknown as T,
    },
  }
}

/*
TODO(WALL-5157): see comment above. We commented this out because it breaks when using queries with fragments.

type Scalar = number | string | boolean | bigint | symbol | undefined

function isObject<T extends object | Scalar>(value: T): value is Exclude<T, Scalar> {
  return typeof value === 'object'
}

async function filterObjectFields<T extends object | Scalar>(
  selectionSet: SelectionSetNode | undefined,
  sourceValue: T | Promise<Maybe<ResolverTypeWrapper<T>>> | null,
): Promise<T | null> {
  // resolved source value can be a Promise or a plain value
  const source = await sourceValue

  if (!source || !selectionSet) {
    return source ?? null
  }

  if (Array.isArray(source)) {
    return Promise.all(source.map((obj) => filterObjectFields(selectionSet, obj))) as T
  }

  if (!isObject(source)) {
    return source
  }

  const result: Record<string, any> = {}

  for (const selection of selectionSet.selections) {
    if (selection.kind !== 'Field') {
      continue
    }

    const key = selection.name.value
    const value = source[key as keyof typeof source]

    if (value !== undefined && selection.selectionSet) {
      result[key] = await filterObjectFields(selection.selectionSet, value)
    } else {
      result[key] = value
    }
  }

  return result as T
}
*/

const undefinedToNull = <T>(value: T): UndefinedToNull<T> => (value ?? null) as UndefinedToNull<T>
