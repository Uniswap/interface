import { useSelector } from 'react-redux'
import { selectCloudBackups } from 'src/features/CloudBackup/selectors'
import { CloudStorageMnemonicBackup } from 'src/features/CloudBackup/types'

export function useCloudBackups(mnemonicId?: string): CloudStorageMnemonicBackup[] {
  const backups = useSelector(selectCloudBackups)
  if (mnemonicId) {
    return backups.filter((b) => b.mnemonicId === mnemonicId)
  }
  return backups
}
