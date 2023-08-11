import { useAppSelector } from 'src/app/hooks'
import { selectCloudBackups } from 'src/features/CloudBackup/selectors'
import { ICloudMnemonicBackup } from 'src/features/CloudBackup/types'

export function useCloudBackups(mnemonicId?: string): ICloudMnemonicBackup[] {
  const backups = useAppSelector(selectCloudBackups)
  if (mnemonicId) return backups.filter((b) => b.mnemonicId === mnemonicId)
  return backups
}
