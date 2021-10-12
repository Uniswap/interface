import { atomWithStore } from 'jotai/redux'
import { createStore } from 'redux'

import reducer, { SwapState } from './reducer'

const store = createStore(reducer)
export const storeAtom = atomWithStore<SwapState>(store)
