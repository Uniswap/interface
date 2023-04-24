import { RootState } from 'src/app/rootReducer'
import { ICloudMnemonicBackup } from 'src/features/CloudBackup/types'

export const selectCloudBackups = (state: RootState): ICloudMnemonicBackup[] => {
  return state.cloudBackup.backupsFound
}

export const selectPasswordAttempts = (state: RootState): number => {
  return state.passwordLockout.passwordAttempts
}

export const selectLockoutEndTime = (state: RootState): number | undefined => {
  return state.passwordLockout.endTime
}
