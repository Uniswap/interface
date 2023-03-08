import { Reducer } from '@reduxjs/toolkit'

import reducer from './reducer'

/* Utility type to extract state type out of a @reduxjs/toolkit Reducer type */
type GetState<T> = T extends Reducer<infer State> ? State : never

export type AppState = {
  [K in keyof typeof reducer]: GetState<typeof reducer[K]>
}
