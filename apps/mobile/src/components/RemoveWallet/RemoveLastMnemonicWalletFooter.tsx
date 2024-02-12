import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { ElementName } from 'src/features/telemetry/constants'
import { Button, CheckBox, Flex, Text } from 'ui/src'

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
                {t(
                  'I backed up my recovery phrase and understand that Uniswap Labs can’t help me recover my wallets if I failed to do so.'
                )}
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
          {!inProgress ? t('Remove wallet') : undefined}
        </Button>
      </Flex>
    </>
  )
}
