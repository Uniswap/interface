/* eslint-disable @typescript-eslint/no-explicit-any */
import { SelectionSetNode } from 'graphql'
import {
  QueryResolvers,
  Resolver,
  ResolverFn,
  ResolverTypeWrapper,
  ResolverWithResolve,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

type ResolverReturnType<T> = T extends (...args: any[]) => infer TResult
  ? TResult
  : T extends { resolve: (...args: any[]) => infer TResult }
  ? TResult
  : never

type ResolverParameters<T extends Resolver<any, any, any, any>> = T extends ResolverWithResolve<
  infer TResult, // only result type is needed to filter selected fields
  any,
  any,
  any
>
  ? Parameters<ResolverFn<TResult, any, any, any>>
  : T extends ResolverFn<infer TResult, any, any, any>
  ? Parameters<ResolverFn<TResult, any, any, any>>
  : never

type ResolverResponses<T extends QueryResolvers> = {
  [K in keyof T]: Promise<ResolverReturnType<T[K]>>
}

function isResolverWithResolve<T extends Resolver<any, any, any, any>>(
  resolver: T
): resolver is Extract<T, ResolverWithResolve<any, any, any, any>> {
  return typeof resolver === 'object' && resolver !== null && 'resolve' in resolver
}

function isResolverFunction<T extends Resolver<any, any, any, any>>(
  resolver: T
): resolver is Extract<T, ResolverFn<any, any, any, any>> {
  return typeof resolver === 'function'
}

export function queryResolvers<T extends QueryResolvers>(
  resolvers: T
): {
  resolved: ResolverResponses<T>
  resolvers: { Query: T }
} {
  // Create a response object with functions to create and resolve promises
  const promiseResolvers = {} as Record<keyof T, (value: any) => void>
  const resolved = Object.fromEntries(
    Object.keys(resolvers).map((key) => [
      key,
      new Promise((resolve) => (promiseResolvers[key as keyof T] = resolve)),
    ])
  ) as ResolverResponses<T>

  return {
    resolved,
    resolvers: {
      Query: Object.fromEntries(
        Object.entries(resolvers).map(([k, resolver]) => {
          const key = k as keyof T
          type R = typeof resolver

          const resolve = async (
            ...params: ResolverParameters<R>
          ): Promise<ResolverReturnType<R>> => {
            const [parent, args, context, info] = params

            const resolvedObj = isResolverWithResolve(resolver)
              ? resolver.resolve(parent, args, context, info)
              : isResolverFunction(resolver)
              ? resolver(parent, args, context, info)
              : null

            const filteredObj = await filterObjectFields(
              info.fieldNodes[0]?.selectionSet,
              resolvedObj
            )

            // Resolve the corresponding promise
            if (promiseResolvers[key]) {
              promiseResolvers[key](filteredObj)
            }

            return filteredObj
          }

          return [key, resolve]
        })
      ) as unknown as T,
    },
  }
}

async function filterObjectFields<T extends object>(
  selectionSet: SelectionSetNode | undefined,
  sourceObject: T | Promise<Maybe<ResolverTypeWrapper<T>>> | null
): Promise<T | null> {
  // resolved source object can be a Promise or a regular object
  const source = await sourceObject

  if (!source || !selectionSet) {
    return source ?? null
  }

  if (Array.isArray(source)) {
    return Promise.all(source.map((obj) => filterObjectFields(selectionSet, obj))) as T
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
