import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { UnitagEntryPoint } from 'uniswap/src/types/screens/mobile'

type UnitagClaimContextType = {
  unitag?: string
  profilePicUri?: string
  entryPoint: UnitagEntryPoint
  setUnitag: (unitag: string | undefined) => void
  setProfilePicUri: (profilePicUri: string | undefined) => void
  setEntryPoint: (entryPoint: UnitagEntryPoint) => void
}

const initialState: UnitagClaimContextType = {
  unitag: undefined,
  profilePicUri: undefined,
  entryPoint: ExtensionScreens.Home,
  setUnitag: () => {},
  setProfilePicUri: () => {},
  setEntryPoint: () => {},
}

const UnitagClaimContext = createContext<UnitagClaimContextType>(initialState)

/**
 * Context used to manage unitag related data for the unitag claims app
 */
export function UnitagClaimContextProvider({ children }: PropsWithChildren): JSX.Element {
  const [unitag, setUnitag] = useState<string | undefined>(initialState.unitag)
  const [profilePicUri, setProfilePicUri] = useState<string | undefined>(initialState.profilePicUri)
  const [entryPoint, setEntryPoint] = useState<UnitagEntryPoint>(initialState.entryPoint)

  const value: UnitagClaimContextType = useMemo(() => {
    return {
      unitag,
      profilePicUri,
      entryPoint,
      setUnitag,
      setProfilePicUri,
      setEntryPoint,
    }
  }, [entryPoint, profilePicUri, unitag])

  return <UnitagClaimContext.Provider value={value}>{children}</UnitagClaimContext.Provider>
}

export function useUnitagClaimContext(): UnitagClaimContextType {
  return useContext(UnitagClaimContext)
}
