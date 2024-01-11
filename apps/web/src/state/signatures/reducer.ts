import { createSlice } from '@reduxjs/toolkit'

import { SignatureDetails } from './types'

export interface SignatureState {
  [account: string]: { [id: string]: SignatureDetails }
}

export const initialState: SignatureState = {}

const signatureSlice = createSlice({
  name: 'signatures',
  initialState,
  reducers: {
    addSignature(signatures, { payload }: { payload: SignatureDetails }) {
      if (signatures[payload.offerer]?.[payload.id]) return

      const accountSignatures = signatures[payload.offerer] ?? {}
      accountSignatures[payload.id] = payload

      signatures[payload.offerer] = accountSignatures
    },
    updateSignature(signatures, { payload }: { payload: SignatureDetails }) {
      if (!signatures[payload.offerer]?.[payload.id]) throw Error('Attempted to update non-existent signature.')

      signatures[payload.offerer][payload.id] = payload
    },
    removeSignature(signatures, { payload }: { payload: { offerer: string; id: string } }) {
      if (signatures[payload.offerer][payload.id]) delete signatures[payload.offerer][payload.id]
    },
  },
})

export const { addSignature, updateSignature, removeSignature } = signatureSlice.actions
export default signatureSlice.reducer
