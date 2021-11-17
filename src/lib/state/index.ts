import { Provider as EthProvider } from '@ethersproject/abstract-provider'
import { atomWithStore } from 'jotai/zustand'
import create from 'zustand'

interface ProviderState {
  provider: EthProvider | undefined
  setProvider: (provider: EthProvider) => void
}

const store = create<ProviderState>((set) => ({
  provider: undefined,
  setProvider: (provider: EthProvider) => set((state) => ({ ...state, provider })),
}))

const storeAtom = atomWithStore(store)

export default storeAtom
