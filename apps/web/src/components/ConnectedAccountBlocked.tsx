import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Blocked } from 'ui/src/components/icons/Blocked'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useModalInitialState } from '~/hooks/useModalInitialState'
import { ModalState } from '~/hooks/useModalState'
import { ExternalLink } from '~/theme/components/Links'

export function ConnectedAccountBlocked({ isOpen, closeModal }: ModalState) {
  const blockedAddress = useModalInitialState(ModalName.BlockedAccount)?.blockedAddress
  const { t } = useTranslation()
  return (
    <Modal name={ModalName.AccountBlocked} isModalOpen={isOpen} onClose={closeModal} padding={0}>
      <Flex centered margin="$spacing32" gap="$spacing24">
        <Flex centered gap="$spacing8">
          <Blocked color="$neutral2" size="$icon.24" />
          <Text variant="heading3">{t('common.blockedAddress')}</Text>
          <Text color="$neutral2" variant="body3">
            {blockedAddress}
          </Text>
        </Flex>
        <Flex centered gap="$spacing8">
          <Text color="$neutral2" variant="body4" textAlign="center">
            <Trans
              i18nKey="common.blocked.reason"
              components={{ link: <ExternalLink href="https://docs.hookswap.org" /> }}
            />
          </Text>
          <Text color="$neutral2" variant="body4" textAlign="center">
            <Trans
              i18nKey="common.blocked.ifError"
              components={{
                emailAddress: (
                  <Flex mt="$spacing12" alignItems="center">
                    <CopyHelper toCopy="support@hookswap.org" iconSize={16} color="$accent1" iconPosition="right">
                      support@hookswap.org
                    </CopyHelper>
                  </Flex>
                ),
              }}
            />
          </Text>
        </Flex>
      </Flex>
    </Modal>
  )
}

export default ConnectedAccountBlocked
