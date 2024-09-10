import { CloudBackupPasswordFormContextProvider } from 'src/features/CloudBackup/CloudBackupForm/CloudBackupPasswordFormContext'
import { ContinueButton } from 'src/features/CloudBackup/CloudBackupForm/ContinueButton'
import { PasswordInput } from 'src/features/CloudBackup/CloudBackupForm/PasswordInput'

export const CloudBackupPassword = {
  PasswordInput,
  ContinueButton,
  FormProvider: CloudBackupPasswordFormContextProvider,
}
