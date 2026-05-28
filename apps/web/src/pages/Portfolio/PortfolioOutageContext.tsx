import { createContext, useContext, useState } from 'react'
import type { DataApiOutageState } from 'uniswap/src/features/dataApi/types'
import { useEvent } from 'utilities/src/react/hooks'

type PortfolioOutageContextType = {
  activityError: Error | undefined
  activityDataUpdatedAt: number | undefined
  setActivityOutage: (error: Error | undefined, dataUpdatedAt: number | undefined) => void
}

const PortfolioOutageContext = createContext<PortfolioOutageContextType>({
  activityError: undefined,
  activityDataUpdatedAt: undefined,
  setActivityOutage: () => {},
})

export function PortfolioOutageProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [activityOutage, setActivityOutageState] = useState<DataApiOutageState>({
    error: undefined,
    dataUpdatedAt: undefined,
  })

  const setActivityOutage = useEvent((error: Error | undefined, dataUpdatedAt: number | undefined) => {
    setActivityOutageState({ error, dataUpdatedAt })
  })

  return (
    <PortfolioOutageContext.Provider
      value={{
        activityError: activityOutage.error,
        activityDataUpdatedAt: activityOutage.dataUpdatedAt,
        setActivityOutage,
      }}
    >
      {children}
    </PortfolioOutageContext.Provider>
  )
}

export function usePortfolioOutageContext(): PortfolioOutageContextType {
  return useContext(PortfolioOutageContext)
}
