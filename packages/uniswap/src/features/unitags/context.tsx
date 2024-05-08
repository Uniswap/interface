import { PropsWithChildren, createContext, useContext, useState } from 'react'

type UnitagUpdaterContextType = {
  refetchUnitagsCounter: number
  triggerRefetchUnitags: () => void
}

const UnitagUpdaterContext = createContext<UnitagUpdaterContextType | null>(null)

export function UnitagUpdaterContextProvider({
  children,
}: PropsWithChildren<unknown>): JSX.Element {
  const [refetchUnitagsCounter, setRefetchUnitagsCounter] = useState(0)

  const triggerRefetchUnitags = (): void => {
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
