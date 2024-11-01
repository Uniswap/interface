/* eslint-disable @typescript-eslint/no-explicit-any */
import { SelectionSetNode } from 'graphql'
import cloneDeepWith from 'lodash/cloneDeepWith'
import {
  QueryResolvers,
  Resolver,
  ResolverFn,
  ResolverTypeWrapper,
  ResolverWithResolve,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

type UndefinedToNull<T> = T extends undefined ? null : T

type ResolverReturnType<T> = T extends (...args: any[]) => infer TResult
  ? TResult
  : T extends { resolve: (...args: any[]) => infer TResult }
    ? TResult
    : never

type ResolverParameters<T extends Resolver<any, any, any, any>> =
  T extends ResolverWithResolve<
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
  resolver: T,
): resolver is Extract<T, ResolverWithResolve<any, any, any, any>> {
  return typeof resolver === 'object' && resolver !== null && 'resolve' in resolver
}

function isResolverFunction<T extends Resolver<any, any, any, any>>(
  resolver: T,
): resolver is Extract<T, ResolverFn<any, any, any, any>> {
  return typeof resolver === 'function'
}

export function queryResolvers<T extends QueryResolvers>(
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

            const updatedValue = await filterObjectFields(info.fieldNodes[0]?.selectionSet, resolvedValue)
            // cloneDeepWith returns any type so we need to cast it manually
            const resultObj = cloneDeepWith(updatedValue, undefinedToNull) as ResolverReturnType<R>

            // Resolve the corresponding promise
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

const undefinedToNull = <T>(value: T): UndefinedToNull<T> => (value ?? null) as UndefinedToNull<T>
