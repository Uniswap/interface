import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { CheckBox } from 'src/components/buttons/CheckBox'
import { Box, Flex } from 'src/components/layout'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'

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
      <Box
        backgroundColor="surface2"
        borderRadius="rounded16"
        mx="spacing16"
        px="spacing8"
        py="spacing12">
        <CheckBox
          checked={checkBoxAccepted}
          text={
            <Box>
              <Trans t={t}>
                <Text color="neutral1" variant="subheadSmall">
                  I backed up my recovery phrase
                </Text>
                <Text color="neutral2" variant="bodySmall">
                  I understand that Uniswap Labs can’t help me recover my wallets if I failed to do
                  so
                </Text>
              </Trans>
            </Box>
          }
          onCheckPressed={onCheckPressed}
        />
      </Box>
      <Flex centered row gap="spacing12" pt="spacing12">
        <Button
          fill
          CustomIcon={inProgress ? <SpinningLoader color="statusCritical" /> : undefined}
          disabled={!checkBoxAccepted}
          emphasis={ButtonEmphasis.Detrimental}
          label={!inProgress ? t('Remove wallet') : undefined}
          testID={ElementName.Confirm}
          onPress={onPress}
        />
      </Flex>
    </>
  )
}
