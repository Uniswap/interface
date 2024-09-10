import { CloudBackupPasswordFormContextProvider } from 'src/features/CloudBackup/CloudBackupForm/CloudBackupPasswordFormContext'
import { ContinueButton } from 'src/features/CloudBackup/CloudBackupForm/ContinueButton'
import { CloudPasswordInput } from 'src/features/CloudBackup/CloudBackupForm/PasswordInput'

export const CloudBackupPassword = {
  PasswordInput: CloudPasswordInput,
  ContinueButton,
  FormProvider: CloudBackupPasswordFormContextProvider,
}
