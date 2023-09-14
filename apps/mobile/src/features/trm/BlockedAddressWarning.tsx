import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex, FlexProps } from 'src/components/layout'
import { BlockedAddressModal } from 'src/components/modals/WarningModal/BlockedAddressModal'
import { Text } from 'src/components/Text'
import { useSporeColors } from 'ui/src'
import InfoCircle from 'ui/src/assets/icons/info-circle.svg'
import { iconSizes } from 'ui/src/theme'

export function BlockedAddressWarning(props: FlexProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

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
            color={colors.neutral2.val}
            height={iconSizes.icon16}
            width={iconSizes.icon16}
          />
          <Text color="neutral2" variant="subheadSmall">
            {t('This wallet is blocked')}
          </Text>
        </Flex>
      </TouchableArea>
    </>
  )
}
