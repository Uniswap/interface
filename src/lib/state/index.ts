import { Provider as EthProvider } from '@ethersproject/abstract-provider'
import { atom } from 'jotai'

export const providerAtom = atom<EthProvider | undefined>(undefined)
