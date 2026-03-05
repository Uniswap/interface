import { QueryClientProvider } from '@tanstack/react-query'
import { SharedQueryClient } from '@universe/api'
import { PropsWithChildren } from 'react'
import { createMockFn } from 'uniswap/src/test/mockFn'

export const mockSharedPersistQueryClientProvider = {
  SharedPersistQueryClientProvider: createMockFn().mockImplementation(MockedSharedPersistQueryClientProvider),
}

function MockedSharedPersistQueryClientProvider({ children }: PropsWithChildren): JSX.Element {
  return <QueryClientProvider client={SharedQueryClient}>{children}</QueryClientProvider>
}
