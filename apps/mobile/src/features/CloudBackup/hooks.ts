import { useAppSelector } from 'src/app/hooks'
import { selectCloudBackups } from 'src/features/CloudBackup/selectors'
import { ICloudMnemonicBackup } from 'src/features/CloudBackup/types'

export function useCloudBackups(): ICloudMnemonicBackup[] {
  return useAppSelector(selectCloudBackups)
}
