import { PRIVACY_SHARING_OPT_OUT_STORAGE_KEY } from 'components/PrivacyChoices/constants'
import { useModalState } from 'hooks/useModalState'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useCallback, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Anchor, Button, Checkbox, Flex, ModalCloseIcon, Text } from 'ui/src'
import { Lock } from 'ui/src/components/icons/Lock'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export function PrivacyChoicesModal() {
  const { isOpen, closeModal } = useModalState(ModalName.PrivacyChoices)
  const { t } = useTranslation()
  const privacySharingOptOutAtom = atomWithStorage<boolean>(PRIVACY_SHARING_OPT_OUT_STORAGE_KEY, false)
  const [privacySharingOptOut, setPrivacySharingOptOut] = useAtom(privacySharingOptOutAtom)
  const [isOptOutChecked, setIsOptOutChecked] = useState(privacySharingOptOut)

  const closeAndResetModal = useCallback(() => {
    // Reset the checkbox if a user doesn't save
    setIsOptOutChecked(privacySharingOptOut)
    closeModal()
  }, [privacySharingOptOut, closeModal])

  const handleSave = useCallback(() => {
    setPrivacySharingOptOut(isOptOutChecked)
    closeModal()
  }, [isOptOutChecked, closeModal, setPrivacySharingOptOut])

  return (
    <Modal name={ModalName.PrivacyChoices} isModalOpen={isOpen} onClose={closeAndResetModal}>
      <Flex fill>
        <Flex py="$spacing20" px="$spacing24" gap="$spacing24">
          <Flex row justifyContent="flex-end">
            <Trace logPress element={ElementName.CloseButton}>
              <ModalCloseIcon onClose={closeAndResetModal} />
            </Trace>
          </Flex>
          <Flex alignItems="center" gap="$gap16">
            <Flex backgroundColor="$surface3" p="$spacing12" borderRadius="$rounded12">
              <Lock color="$neutral1" size="$icon.24" />
            </Flex>
            <Text variant="subheading1">{t('common.privacyChoices')}</Text>
            <Text variant="body3" color="$neutral2" textAlign="center">
              <Trans
                i18nKey="common.privacyChoices.description"
                components={{
                  privacyLink: (
                    <Anchor
                      href={uniswapUrls.privacyPolicyUrl}
                      target="_blank"
                      textDecorationLine="none"
                      fontSize="inherit"
                    />
                  ),
                }}
              />
            </Text>
            <Flex
              p="$padding16"
              borderRadius="$rounded16"
              borderWidth="$border.width1"
              borderColor="$surface3"
              borderStyle="solid"
              gap="$gap8"
            >
              <Flex row alignItems="center" gap="$gap12">
                <Checkbox checked={isOptOutChecked} onCheckedChange={(checked) => setIsOptOutChecked(!!checked)} />
                <Text variant="buttonLabel2" color="$neutral1">
                  {t('common.privacyChoices.checkbox.label')}
                </Text>
              </Flex>
              <Text variant="body4" color="$neutral2">
                {t('common.privacyChoices.checkbox.description')}
              </Text>
            </Flex>
          </Flex>
          <Text variant="body4" color="$neutral2" fontSize={10}>
            {t('common.privacyChoices.disclaimer')}
          </Text>
          <Flex row>
            <Button emphasis="secondary" onPress={handleSave}>
              {t('common.button.save')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
