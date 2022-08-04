import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { RootState } from 'src/app/rootReducer'

interface EnsData {
  name: string
  avatarUri?: string
}
interface ENSState {
  ensForAddress: Record<Address, EnsData>
}
export const initialEnsState: ENSState = {
  ensForAddress: {},
}
const slice = createSlice({
  name: 'ens',
  initialState: initialEnsState,
  reducers: {
    updateName: (state, action: PayloadAction<{ address: Address; name: string }>) => {
      const { address, name } = action.payload
      state.ensForAddress[address] = state.ensForAddress[address] ?? {}
      // Update cached name if valid name found.
      if (name) {
        state.ensForAddress[address].name = name
      }
    },
    updateAvatarUri: (state, action: PayloadAction<{ address: Address; avatarUri: string }>) => {
      const { address, avatarUri } = action.payload
      state.ensForAddress[address] = state.ensForAddress[address] ?? {}
      // Update store if valid uri found.
      if (avatarUri) {
        state.ensForAddress[address].avatarUri = avatarUri
      }
    },
    resetEns: () => initialEnsState,
  },
})
export const { updateName, updateAvatarUri, resetEns } = slice.actions
export const ensReducer = slice.reducer

export const selectAddressEns = (state: RootState) => state.ens.ensForAddress

export function useCachedEns(address: Nullable<Address>) {
  const cache = useAppSelector(selectAddressEns)
  const addressEns = address ? cache[address] : undefined
  return useMemo(() => {
    return {
      name: addressEns?.name ?? undefined,
      avatarUri: addressEns?.avatarUri ?? undefined,
    }
  }, [addressEns?.avatarUri, addressEns?.name])
}
