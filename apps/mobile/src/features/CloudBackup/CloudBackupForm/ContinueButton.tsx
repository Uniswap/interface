import { useTranslation } from 'react-i18next'
import { useCloudBackupPasswordFormContext } from 'src/features/CloudBackup/CloudBackupForm/CloudBackupPasswordFormContext'
import { DeprecatedButton } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function ContinueButton({ onPressContinue }: { onPressContinue?: () => void }): JSX.Element {
  const { isInputValid, onPressNext } = useCloudBackupPasswordFormContext()

  const { t } = useTranslation()

  return (
    <DeprecatedButton isDisabled={!isInputValid} testID={TestID.Next} onPress={onPressContinue ?? onPressNext}>
      {t('common.button.continue')}
    </DeprecatedButton>
  )
}
