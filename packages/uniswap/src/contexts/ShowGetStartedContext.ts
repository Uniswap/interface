import React from 'react'

const ShowGetStartedContext = React.createContext<boolean>(false)

export const ShowGetStartedProvider = ShowGetStartedContext.Provider

export function useShowGetStarted(): boolean {
  return React.useContext(ShowGetStartedContext)
}
