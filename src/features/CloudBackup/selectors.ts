import { RootState } from 'src/app/rootReducer'
import { ICloudMnemonicBackup } from 'src/features/CloudBackup/types'

export const selectCloudBackups = (state: RootState): ICloudMnemonicBackup[] => {
  return state.cloudBackup.backupsFound
}
