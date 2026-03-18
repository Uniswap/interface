'use strict'

const { RuleTester } = require('eslint')
const rule = require('./enforce-query-options-result')

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
})

ruleTester.run('enforce-query-options-result', rule, {
  valid: [
    // Function with correct return type
    {
      code: `
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { queryOptions } from '@tanstack/react-query'

export function getUserQueryOptions(id: string): QueryOptionsResult<User> {
  return queryOptions({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  })
}
      `,
    },
    // Function that doesn't return query options
    {
      code: `
export function getUser(id: string): User {
  return { id, name: 'Test' }
}
      `,
    },
    // Function without matching name pattern
    {
      code: `
export function fetchData() {
  return queryOptions({
    queryKey: ['data'],
    queryFn: () => getData(),
  })
}
      `,
    },
    // Function with matching name pattern but no return type - now allowed
    {
      code: `
import { queryOptions } from '@tanstack/react-query'

export function getUserQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  })
}
      `,
    },
    // Arrow function with matching name pattern but no return type - now allowed
    {
      code: `
import { queryOptions } from '@tanstack/react-query'

export const makeQueryOptions = (id: string) => {
  return queryOptions({
    queryKey: ['item', id],
    queryFn: () => fetchItem(id),
  })
}
      `,
    },
    // Already using QueryOptionsResult with full generics
    {
      code: `
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { queryOptions } from '@tanstack/react-query'

const makeUserQueryOptions = (id: string): QueryOptionsResult<User, Error, User, ['user', string]> => {
  return queryOptions({
    queryKey: ['user', id] as const,
    queryFn: () => fetchUser(id),
  })
}
      `,
    },
    // Using DefinedInitialDataOptions - now allowed since it's not in the prohibited list
    {
      code: `
import { DefinedInitialDataOptions } from '@tanstack/react-query'
import { queryOptions } from '@tanstack/react-query'

function getPostQueryOptions(id: number): DefinedInitialDataOptions<Post> {
  return queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    initialData: { id, title: 'Loading...' },
  })
}
      `,
    },
    // Using other TanStack Query types - now allowed
    {
      code: `
import { UndefinedInitialDataOptions } from '@tanstack/react-query'
import { queryOptions } from '@tanstack/react-query'

function getDataQueryOptions(): UndefinedInitialDataOptions<Data> {
  return queryOptions({
    queryKey: ['data'],
    queryFn: () => fetchData(),
  })
}
      `,
    },
  ],

  invalid: [
    // Using UseQueryOptions
    {
      code: `
import { UseQueryOptions } from '@tanstack/react-query'
import { queryOptions } from '@tanstack/react-query'

export function getUserQueryOptions(id: string): UseQueryOptions<User> {
  return queryOptions({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  })
}
      `,
      errors: [
        {
          messageId: 'useQueryOptionsResult',
          data: { actualType: 'UseQueryOptions' },
        },
      ],
      output: `
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { UseQueryOptions } from '@tanstack/react-query'
import { queryOptions } from '@tanstack/react-query'

export function getUserQueryOptions(id: string): QueryOptionsResult<User> {
  return queryOptions({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  })
}
      `,
    },
    // Using UseQueryResult
    {
      code: `
import { UseQueryResult } from '@tanstack/react-query'

export function getQueryResult(): UseQueryResult<Data> {
  return useQuery(queryOptions({
    queryKey: ['data'],
    queryFn: fetchData,
  }))
}
      `,
      errors: [
        {
          messageId: 'useQueryOptionsResult',
          data: { actualType: 'UseQueryResult' },
        },
      ],
      output: `
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { UseQueryResult } from '@tanstack/react-query'

export function getQueryResult(): QueryOptionsResult<Data> {
  return useQuery(queryOptions({
    queryKey: ['data'],
    queryFn: fetchData,
  }))
}
      `,
    },
    // Using QueryOptions (generic base type)
    {
      code: `
import { QueryOptions } from '@tanstack/react-query'

export const makeQuery = (): QueryOptions => {
  return {
    queryKey: ['test'],
    queryFn: async () => ({ data: 'test' }),
  }
}
      `,
      errors: [
        {
          messageId: 'useQueryOptionsResult',
          data: { actualType: 'QueryOptions' },
        },
      ],
      output: `
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { QueryOptions } from '@tanstack/react-query'

export const makeQuery = (): QueryOptionsResult => {
  return {
    queryKey: ['test'],
    queryFn: async () => ({ data: 'test' }),
  }
}
      `,
    },
  ],
})
