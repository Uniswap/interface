import 'cross-fetch/polyfill'
import React, { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

// TODO: replace with rtk-query
export function QueryProvider({ children }: PropsWithChildren<{}>) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
