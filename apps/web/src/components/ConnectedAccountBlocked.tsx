import { Anchor, Flex, Text } from '@universe/mycelium'
import { Blocked } from '@universe/mycelium/icons/Blocked'
import { useTranslation } from 'react-i18next'
import { Trans } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useModalInitialState } from '~/hooks/useModalInitialState'
import { ModalState } from '~/hooks/useModalState'
import { ExternalLink } from '~/theme/components/Links'

export function ConnectedAccountBlocked({ isOpen, closeModal }: ModalState) {
  const blockedAddress = useModalInitialState(ModalName.BlockedAccount)?.blockedAddress
  const { t } = useTranslation()
  return (
    <Modal name={ModalName.AccountBlocked} isModalOpen={isOpen} onClose={closeModal}>
      <Flex centered gap="$spacing16">
        <Flex backgroundColor="$surface3" p="$spacing12" borderRadius="$rounded12">
          <Blocked color="$neutral1" size="$icon.24" />
        </Flex>
        <Flex centered gap="$spacing8">
          <Text variant="subheading1">{t('common.blockedAddress')}</Text>
          <Text color="$neutral2" variant="body3">
            {blockedAddress}
          </Text>
        </Flex>
        <Flex centered gap="$spacing8">
          <Text color="$neutral2" variant="body3" textAlign="center">
            <Trans
              i18nKey="common.blocked.reason"
              components={{ link: <ExternalLink href="https://help.uniswap.org/en/articles/6149816" /> }}
            />
          </Text>
          <Text color="$neutral2" variant="body3" textAlign="center">
            <Trans
              i18nKey="common.blocked.ifError"
              components={{
                // The catalog string ends in "...to <emailAddress />", and the placeholder is
                // self-closing, so Trans clones it with no children — the anchor carries its own
                // text. It also has to render inline: Text is display:inline, so a Flex (a block
                // flex box) here drops the email out of the sentence onto its own line.
                emailAddress: (
                  <Anchor href="mailto:compliance@uniswap.org" variant="body3" color="$neutral1">
                    compliance@uniswap.org
                  </Anchor>
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
