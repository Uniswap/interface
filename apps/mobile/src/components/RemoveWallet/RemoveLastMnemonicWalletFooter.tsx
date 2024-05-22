import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, CheckBox, Flex, Text } from 'ui/src'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { ElementName } from 'wallet/src/telemetry/constants'

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
      <Flex
        backgroundColor="$surface2"
        borderRadius="$rounded16"
        mx="$spacing16"
        p="$spacing12"
        width="100%">
        <CheckBox
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
          disabled={!checkBoxAccepted}
          icon={inProgress ? <SpinningLoader color="$statusCritical" /> : undefined}
          testID={ElementName.Confirm}
          theme="detrimental"
          onPress={onPress}>
          {!inProgress ? t('account.wallet.button.remove') : undefined}
        </Button>
      </Flex>
    </>
  )
}
