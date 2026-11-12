import { Flex, Text, TouchableArea } from '@universe/mycelium'
import type { FlexCompatProps as FlexProps } from '@universe/mycelium'
import { InfoCircle } from '@universe/mycelium/icons/InfoCircle'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BlockedAddressModal } from 'uniswap/src/features/transactions/modals/BlockedAddressModal'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'

export function BlockedAddressWarning({
  isRecipientBlocked,
  address,
  ...props
}: { isRecipientBlocked?: boolean; address?: string } & FlexProps): JSX.Element {
  const { t } = useTranslation()
  const [showBlockedAddressModal, setShowBlockedAddressModal] = useState(false)

  return (
    <>
      <BlockedAddressModal
        isOpen={showBlockedAddressModal}
        address={address}
        onClose={(): void => setShowBlockedAddressModal(false)}
      />
      <TouchableArea
        onPress={(): void => {
          dismissNativeKeyboard()
          setShowBlockedAddressModal(true)
        }}
      >
        <Flex gap="$spacing8" {...props}>
          <InfoCircle color="$neutral2" size="$icon.16" />
          <Text color="$neutral2" variant="subheading2">
            {isRecipientBlocked ? t('send.warning.blocked.recipient') : t('send.warning.blocked.default')}
          </Text>
        </Flex>
      </TouchableArea>
    </>
  )
}
