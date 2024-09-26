import Column from 'components/deprecated/Column'
import Modal from 'components/Modal'
import styled, { useTheme } from 'lib/styled-components'
import { Slash } from 'react-feather'
import { CopyHelper, ExternalLink, ThemedText } from 'theme/components'
import { Flex, Text } from 'ui/src'
import { Trans } from 'uniswap/src/i18n'

const ContentWrapper = styled(Column)`
  align-items: center;
  margin: 32px;
  text-align: center;
  font-size: 12px;
`
interface ConnectedAccountBlockedProps {
  account?: string | null
  isOpen: boolean
}

export default function ConnectedAccountBlocked(props: ConnectedAccountBlockedProps) {
  const theme = useTheme()
  return (
    <Modal isOpen={props.isOpen} onDismiss={Function.prototype()}>
      <ContentWrapper>
        <Slash size="22px" color={theme.neutral2} />
        <ThemedText.DeprecatedLargeHeader lineHeight={2} marginBottom={1} marginTop={1}>
          <Trans i18nKey="common.blockedAddress" />
        </ThemedText.DeprecatedLargeHeader>
        <Text color="$neutral2" fontSize={14} mb={12}>
          {props.account}
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
