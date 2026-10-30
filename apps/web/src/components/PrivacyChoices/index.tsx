import { Anchor, Flex, ModalCloseIcon, Text } from '@universe/mycelium'
import { Lock } from '@universe/mycelium/icons/Lock'
import { useTranslation } from 'react-i18next'
import { Trans } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useModalState } from '~/hooks/useModalState'

export function PrivacyChoicesModal() {
  const { isOpen, closeModal } = useModalState(ModalName.PrivacyChoices)
  const { t } = useTranslation()

  return (
    <Modal name={ModalName.PrivacyChoices} isModalOpen={isOpen} onClose={closeModal}>
      <Flex fill>
        <Flex py="$spacing20" px="$spacing24" gap="$spacing24">
          <Flex row justifyContent="flex-end">
            <Trace logPress element={ElementName.CloseButton}>
              <ModalCloseIcon onClose={closeModal} />
            </Trace>
          </Flex>
          <Flex alignItems="center" gap="$gap16">
            <Flex backgroundColor="$surface3" p="$spacing12" borderRadius="$rounded12">
              <Lock color="$neutral1" size="$icon.24" />
            </Flex>
            <Text variant="subheading1">{t('common.privacyChoices')}</Text>
            <Flex gap="$gap12">
              <Text variant="body3" color="$neutral2" textAlign="center">
                {t('settings.setting.shareDeviceIdentifiers.message')}
              </Text>
              <Text variant="body3" color="$neutral2" textAlign="center">
                {t('common.privacyChoices.optOut', { settingName: t('settings.setting.shareDeviceIdentifiers.title') })}
              </Text>
              <Text variant="body3" color="$neutral2" textAlign="center">
                <Trans
                  i18nKey="common.privacyChoices.policy"
                  components={{
                    privacyLink: (
                      <Anchor
                        href={UniswapStaticUrls.privacyPolicyUrl}
                        target="_blank"
                        textDecorationLine="none"
                        fontSize="inherit"
                      />
                    ),
                  }}
                />
              </Text>
            </Flex>
          </Flex>
          <Text variant="body4" color="$neutral2" fontSize={10} textAlign="center">
            {t('common.privacyChoices.disclaimer')}
          </Text>
        </Flex>
      </Flex>
    </Modal>
  )
}

export default PrivacyChoicesModal
