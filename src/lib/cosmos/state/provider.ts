import { atom } from 'jotai'
import { Provider } from 'widgets-web3-react/types'

export const cosmosProviderAtom = atom<Provider | undefined>(undefined)
