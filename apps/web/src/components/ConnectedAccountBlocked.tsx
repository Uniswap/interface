import Column from 'components/deprecated/Column'
import { useModalInitialState } from 'hooks/useModalInitialState'
import { ModalState } from 'hooks/useModalState'
import { deprecatedStyled } from 'lib/styled-components'
import { Slash } from 'react-feather'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { CopyHelper } from 'theme/components/CopyHelper'
import { ExternalLink } from 'theme/components/Links'
import { Flex, Text, useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const ContentWrapper = deprecatedStyled(Column)`
  align-items: center;
  margin: 32px;
  text-align: center;
  font-size: 12px;
`

export default function ConnectedAccountBlocked({ isOpen, closeModal }: ModalState) {
  const colors = useSporeColors()

  const blockedAddress = useModalInitialState(ModalName.BlockedAccount)?.blockedAddress

  return (
    <Modal name={ModalName.AccountBlocked} isModalOpen={isOpen} onClose={closeModal} padding={0}>
      <ContentWrapper>
        <Slash size="22px" color={colors.neutral2.val} />
        <ThemedText.DeprecatedLargeHeader lineHeight={2} marginBottom={1} marginTop={1}>
          <Trans i18nKey="common.blockedAddress" />
        </ThemedText.DeprecatedLargeHeader>
        <Text color="$neutral2" fontSize={14} mb={12}>
          {blockedAddress}
        </Text>
        <ThemedText.DeprecatedMain fontSize={12} marginBottom={12}>
          <Trans
            i18nKey="common.blocked.reason"
            components={{ link: <ExternalLink href="https://help.uniswap.org/en/articles/6149816" /> }}
          />
        </ThemedText.DeprecatedMain>
        <ThemedText.DeprecatedMain fontSize={12}>
          <Trans
            i18nKey="common.blocked.ifError"
            components={{
              emailAddress: (
                <Flex mt={12} alignItems="center">
                  <CopyHelper toCopy="compliance@uniswap.org" iconSize={16} color="$accent1" iconPosition="right">
                    compliance@uniswap.org
                  </CopyHelper>
                </Flex>
              ),
            }}
          />
        </ThemedText.DeprecatedMain>
      </ContentWrapper>
    </Modal>
  )
}
