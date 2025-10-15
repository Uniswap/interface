import { QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'
import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'

export const mockSharedPersistQueryClientProvider = {
  SharedPersistQueryClientProvider: jest.fn().mockImplementation(MockedSharedPersistQueryClientProvider),
}

function MockedSharedPersistQueryClientProvider({ children }: PropsWithChildren): JSX.Element {
  return <QueryClientProvider client={SharedQueryClient}>{children}</QueryClientProvider>
}
