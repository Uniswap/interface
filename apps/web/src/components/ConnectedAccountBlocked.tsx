import Column from 'components/deprecated/Column'
import { useAccount } from 'hooks/useAccount'
import { ModalState } from 'hooks/useModalState'
import styled, { useTheme } from 'lib/styled-components'
import { Slash } from 'react-feather'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { CopyHelper } from 'theme/components/CopyHelper'
import { ExternalLink } from 'theme/components/Links'
import { Flex, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const ContentWrapper = styled(Column)`
  align-items: center;
  margin: 32px;
  text-align: center;
  font-size: 12px;
`

export default function ConnectedAccountBlocked(props: ModalState) {
  const account = useAccount()
  const theme = useTheme()
  return (
    <Modal name={ModalName.AccountBlocked} isModalOpen={props.isOpen} onClose={props.closeModal} padding={0}>
      <ContentWrapper>
        <Slash size="22px" color={theme.neutral2} />
        <ThemedText.DeprecatedLargeHeader lineHeight={2} marginBottom={1} marginTop={1}>
          <Trans i18nKey="common.blockedAddress" />
        </ThemedText.DeprecatedLargeHeader>
        <Text color="$neutral2" fontSize={14} mb={12}>
          {account.address}
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
                  <CopyHelper
                    toCopy="compliance@uniswap.org"
                    fontSize={14}
                    iconSize={16}
                    color={theme.accent1}
                    iconPosition="right"
                  >
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
