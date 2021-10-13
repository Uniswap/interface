import { atomWithReducer } from 'jotai/utils'

import reducer, { initialState } from './reducer'

export const swapAtom = atomWithReducer(initialState, reducer)
