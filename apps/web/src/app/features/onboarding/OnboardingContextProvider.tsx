import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react'

type OnboardingContextState = {
  password: string | undefined
  pendingAddress: string | undefined
  pendingMnemonic: string[] | undefined
  setPassword: Dispatch<SetStateAction<string | undefined>>
  setPendingAddress: Dispatch<SetStateAction<string | undefined>>
  setPendingMnemonic: Dispatch<SetStateAction<string[] | undefined>>
}

/**
 * Context to share state between onboarding screens without having to use Redux or React Router.
 * For example, the password is set in the first screen and used in the second screen to encrypt the mnemonic.
 */
export const OnboardingContext = createContext<OnboardingContextState | undefined>(undefined)

export const OnboardingContextProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [password, setPassword] = useState<string | undefined>(undefined)
  const [pendingAddress, setPendingAddress] = useState<string | undefined>(undefined)
  const [pendingMnemonic, setPendingMnemonic] = useState<string[] | undefined>(undefined)

  return (
    <OnboardingContext.Provider
      value={{
        password,
        pendingAddress,
        pendingMnemonic,
        setPassword,
        setPendingAddress,
        setPendingMnemonic,
      }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboardingContext = (): OnboardingContextState => {
  const onboardingContext = useContext(OnboardingContext)
  if (onboardingContext === undefined) {
    throw new Error('useOnboardingContext must be inside a OnboardingContextProvider')
  }
  return onboardingContext
}
