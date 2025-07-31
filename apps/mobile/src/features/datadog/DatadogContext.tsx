import { createContext, useContext } from 'react'

/**
 * Until Datadog provides a way to check if the SDK is initialized, this context is
 * used to track the status of the SDK.
 */
type DatadogContextType = {
  isInitialized: boolean
  setInitialized: (initialized: boolean) => void
}

export const DatadogContext = createContext<DatadogContextType | undefined>(undefined)

/**
 * Hook to get the status of the Datadog SDK.
 */
export const useDatadogStatus = (): DatadogContextType => {
  const context = useContext(DatadogContext)
  if (!context) {
    throw new Error('useDatadogStatus must be used within a DatadogProvider')
  }
  return context
}
