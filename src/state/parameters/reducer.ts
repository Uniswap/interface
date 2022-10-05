import { createSlice } from '@reduxjs/toolkit'

export interface VdfParam {
  readonly t: number
  readonly g: string
  readonly g_two_t: string
  readonly g_two_t_plus_one: string
  readonly n: string
  readonly base: string
  readonly word_size: number
  readonly word_count: number
}

export interface ParameterState {
  readonly vdfParam: VdfParam | null
  readonly vdfSnarkParam: string
  readonly encryptionParam: string
  readonly encryptionProverKey: string
  readonly encryptionVerifierData: string
  readonly progress: number
}

const initialState: ParameterState = {
  vdfParam: null,
  vdfSnarkParam: '',
  encryptionParam: '',
  encryptionProverKey: '',
  encryptionVerifierData: '',
  progress: 0,
}

const parameterSlice = createSlice({
  name: 'parameters',
  initialState,
  reducers: {
    setVdfParam(state, action: { payload: { newParam: VdfParam } }) {
      state.vdfParam = action.payload.newParam
    },
    setVdfSnarkParam(state, action: { payload: { newParam: string } }) {
      state.vdfSnarkParam = action.payload.newParam
    },
    setEncryptionParam(state, action: { payload: { newParam: string } }) {
      state.encryptionParam = action.payload.newParam
    },
    setEncryptionProverKey(state, action: { payload: { newParam: string } }) {
      state.encryptionProverKey = action.payload.newParam
    },
    setEncryptionVerifierData(state, action: { payload: { newParam: string } }) {
      state.encryptionVerifierData = action.payload.newParam
    },
    setZkpParameters(state, action: { payload: { newParam: ParameterState } }) {
      state = action.payload.newParam
    },
    setProgress(state, action: { payload: { newParam: number } }) {
      state.progress = action.payload.newParam
    },
  },
})

export const {
  setVdfParam,
  setVdfSnarkParam,
  setEncryptionParam,
  setEncryptionProverKey,
  setEncryptionVerifierData,
  setZkpParameters,
  setProgress,
} = parameterSlice.actions
export default parameterSlice.reducer
