import { useQueryClient } from '@tanstack/react-query'
import { PropsWithChildren, createContext, useContext, useState } from 'react'
import { UNITAGS_API_CACHE_KEY } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { logger } from 'utilities/src/logger/logger'

// TODO(WALL-4257): Delete this context provider once we're fully migrated to react-query.
//                  We can just call `resetQueries` directly where needed instead.

type UnitagUpdaterContextType = {
  refetchUnitagsCounter: number
  triggerRefetchUnitags: () => void
}

const UnitagUpdaterContext = createContext<UnitagUpdaterContextType | null>(null)

export function UnitagUpdaterContextProvider({ children }: PropsWithChildren<unknown>): JSX.Element {
  const [refetchUnitagsCounter, setRefetchUnitagsCounter] = useState(0)

  const queryClient = useQueryClient()

  const triggerRefetchUnitags = (): void => {
    queryClient.resetQueries({ queryKey: [UNITAGS_API_CACHE_KEY] }).catch((error) => {
      logger.error(error, {
        tags: {
          file: 'unitags/context.tsx',
          function: 'triggerRefetchUnitags',
        },
      })
    })
    setRefetchUnitagsCounter((prevCounter) => prevCounter + 1)
  }

  return (
    <UnitagUpdaterContext.Provider value={{ refetchUnitagsCounter, triggerRefetchUnitags }}>
      {children}
    </UnitagUpdaterContext.Provider>
  )
}

export const useUnitagUpdater = (): UnitagUpdaterContextType => {
  const context = useContext(UnitagUpdaterContext)
  if (!context) {
    throw new Error('useUnitagUpdate must be used within a UnitagUpdateProvider')
  }
  return context
}
