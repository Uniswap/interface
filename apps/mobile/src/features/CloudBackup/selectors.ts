import { MobileState } from 'src/app/reducer'
import { ICloudMnemonicBackup } from 'src/features/CloudBackup/types'

export const selectCloudBackups = (state: MobileState): ICloudMnemonicBackup[] => {
  return state.cloudBackup.backupsFound
}

export const selectPasswordAttempts = (state: MobileState): number => {
  return state.passwordLockout.passwordAttempts
}

export const selectLockoutEndTime = (state: MobileState): number | undefined => {
  return state.passwordLockout.endTime
}
