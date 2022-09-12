import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { RootState } from 'src/app/rootReducer'

interface EnsData {
  avatarUri?: string
}
interface ENSState {
  ensForAddress: Record<Address, EnsData>
}
export const initialEnsState: ENSState = {
  ensForAddress: {},
}

// TODO: deprecate this slice after moving ensAvatar to rtk query
const slice = createSlice({
  name: 'ens',
  initialState: initialEnsState,
  reducers: {
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
export const { updateAvatarUri, resetEns } = slice.actions
export const ensReducer = slice.reducer

export const selectAddressEns = (state: RootState) => state.ens.ensForAddress

export function useCachedEns(address: NullUndefined<Address>) {
  const cache = useAppSelector(selectAddressEns)
  const addressEns = address ? cache[address] : undefined
  return useMemo(() => {
    return {
      avatarUri: addressEns?.avatarUri ?? undefined,
    }
  }, [addressEns?.avatarUri])
}
