import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ChangeUnitagConfirmButtonProps } from 'wallet/src/features/unitags/ChangeUnitagConfirmButton'

export const ChangeUnitagConfirmButton = ({
  isSubmitButtonDisabled,
  isCheckingUnitag,
  isChangeResponseLoading,
  onPressSaveChanges,
}: ChangeUnitagConfirmButtonProps): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Flex row width="100%" pt="$spacing4">
      <Button
        isDisabled={isSubmitButtonDisabled}
        loading={isCheckingUnitag || isChangeResponseLoading}
        testID={TestID.Confirm}
        variant="branded"
        emphasis="primary"
        onPress={onPressSaveChanges}
      >
        {t('common.button.save')}
      </Button>
    </Flex>
  )
}
