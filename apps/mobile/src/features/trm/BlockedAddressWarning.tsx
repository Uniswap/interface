import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex, FlexProps } from 'src/components/layout'
import { BlockedAddressModal } from 'src/components/modals/WarningModal/BlockedAddressModal'
import { Text } from 'src/components/Text'

export function BlockedAddressWarning(props: FlexProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const [showBlockedAddressModal, setShowBlockedAddressModal] = useState(false)

  return (
    <>
      {showBlockedAddressModal && (
        <BlockedAddressModal onClose={(): void => setShowBlockedAddressModal(false)} />
      )}
      <TouchableArea
        onPress={(): void => {
          Keyboard.dismiss()
          setShowBlockedAddressModal(true)
        }}>
        <Flex gap="spacing8" {...props}>
          <InfoCircle
            color={theme.colors.textSecondary}
            height={theme.iconSizes.icon16}
            width={theme.iconSizes.icon16}
          />
          <Text color="textSecondary" variant="subheadSmall">
            {t('This wallet is blocked')}
          </Text>
        </Flex>
      </TouchableArea>
    </>
  )
}
