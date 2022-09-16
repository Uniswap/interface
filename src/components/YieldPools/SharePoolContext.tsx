import React, { useContext } from 'react'

export type SharePoolSetter = (addr: string) => void
export const SharePoolContext = React.createContext<SharePoolSetter>(() => {
  // empty
})
export const useSharePoolContext = () => {
  return useContext(SharePoolContext)
}
