import React from 'react'
import { useTranslation } from 'react-i18next'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { Button, Flex, IconButton, InlineCard, Text, useSporeColors } from 'ui/src'
import { AlertTriangleFilled, Key } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { SPACE_STRING } from 'utilities/src/primitives/string'

/**
 * This modal is used as an informational speedbump before the user
 * is sent to the screen to view their private keys.
 */
export function PrivateKeySpeedBumpModal({
  navigation,
}: AppStackScreenProp<typeof ModalName.PrivateKeySpeedBumpModal>): JSX.Element | null {
  const colors = useSporeColors()
  const { onClose, preventCloseRef } = useReactNavigationModal()

  const onContinue = (): void => {
    preventCloseRef.current = true
    navigation.navigate(MobileScreens.ViewPrivateKeys)
  }

  return (
    <Modal backgroundColor={colors.surface1.val} name={ModalName.PrivateKeySpeedBumpModal} onClose={onClose}>
      <PrivateKeySpeedBumpModalContent onClose={onClose} onContinue={onContinue} />
    </Modal>
  )
}

const PrivateKeySpeedBumpModalContent = ({
  onClose,
  onContinue,
}: {
  onClose: () => void
  onContinue: () => void
}): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Flex px="$spacing24" pt="$spacing8">
      <Flex row justifyContent="center">
        <IconButton size="medium" emphasis="secondary" icon={<Key />} onPress={onClose} />
      </Flex>
      <Text textAlign="center" variant="subheading1" pt="$spacing24">
        {t('privateKeys.export.modal.title')}
      </Text>
      <Text textAlign="center" variant="body2" color="$neutral2" pt="$spacing8">
        {t('privateKeys.export.modal.subtitle')}
        <Text variant="body2" color="$neutral1" ml="$spacing4" onPress={() => {}}>
          {/* TODO(ALL-6735): Add link to learn more about private keys */}
          {SPACE_STRING + t('common.button.learn')}
        </Text>
      </Text>
      <Flex pt="$spacing16">
        <InlineCard
          Icon={AlertTriangleFilled}
          color="$neutral2"
          description={
            <Text variant="body3" color="$neutral2">
              {t('privateKeys.export.modal.warning')}
            </Text>
          }
          iconColor="$neutral2"
        />
      </Flex>
      <Flex row py="$spacing24">
        <Button testID={TestID.Continue} variant="branded" emphasis="primary" size="medium" onPress={onContinue}>
          {t('common.button.continue')}
        </Button>
      </Flex>
    </Flex>
  )
}
