import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CloudStorageMnemonicBackup } from 'src/features/CloudBackup/types'

// eslint-disable-next-line import/no-unused-modules
export interface CloudBackupState {
  backupsFound: CloudStorageMnemonicBackup[]
}

export const initialCloudBackupState: Readonly<CloudBackupState> = {
  backupsFound: [],
}

const slice = createSlice({
  name: 'cloudBackup',
  initialState: initialCloudBackupState,
  reducers: {
    foundCloudBackup: (state, action: PayloadAction<{ backup: CloudStorageMnemonicBackup }>) => {
      const { backup } = action.payload
      const duplicateBackup = state.backupsFound.some((b) => b.mnemonicId === backup.mnemonicId)
      if (!duplicateBackup) {
        state.backupsFound.push(backup)
      }
    },
    clearCloudBackups: (state) => {
      state.backupsFound = []
    },
  },
})

export const { foundCloudBackup, clearCloudBackups } = slice.actions
export const { reducer: cloudBackupReducer } = slice
