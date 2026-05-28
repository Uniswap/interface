import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, LabeledCheckbox, SpinningLoader, Text } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function RemoveLastMnemonicWalletFooter({
  onPress,
  inProgress,
}: {
  onPress: () => void
  inProgress: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const [checkBoxAccepted, setCheckBoxAccepted] = useState(false)
  const onCheckPressed = (): void => setCheckBoxAccepted(!checkBoxAccepted)

  return (
    <>
      <Flex backgroundColor="$surface2" borderRadius="$rounded16" mx="$spacing16" p="$spacing12" width="100%">
        <LabeledCheckbox
          checked={checkBoxAccepted}
          text={
            <Flex>
              <Text color="$neutral2" variant="body3">
                {t('account.wallet.remove.check')}
              </Text>
            </Flex>
          }
          onCheckPressed={onCheckPressed}
        />
      </Flex>
      <Flex centered row mt="$spacing8">
        <Button
          fill
          size="large"
          isDisabled={!checkBoxAccepted}
          icon={inProgress ? <SpinningLoader color="$statusCritical" /> : undefined}
          testID={TestID.Confirm}
          variant="critical"
          emphasis="secondary"
          onPress={onPress}
        >
          {!inProgress ? t('account.wallet.button.remove') : undefined}
        </Button>
      </Flex>
    </>
  )
}
