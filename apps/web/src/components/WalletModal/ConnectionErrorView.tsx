import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { useConnectWithLogs } from 'connection/activate'
import { Trans } from 'i18n'
import { useCallback } from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap } from 'theme/styles'

const Wrapper = styled.div`
  ${flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 100%;
`

const AlertTriangleIcon = styled(AlertTriangle)`
  width: 90px;
  height: 90px;
  stroke-width: 1;
  margin: 36px;
  color: ${({ theme }) => theme.critical};
`

// TODO(cartcrom): move this to a top level modal, rather than inline in the drawer
export default function ConnectionErrorView({
  connectWithLogs,
}: {
  connectWithLogs: ReturnType<typeof useConnectWithLogs>
}) {
  const { variables, connect, reset } = connectWithLogs
  const connector = variables?.connector
  const retry = useCallback(() => {
    if (!connector) {
      return
    }

    if (typeof connector === 'function') {
      console.warn('a createConnectorFn was passed to the connect() function, rather than a Connector instance')
      return
    }

    connect(connector)
  }, [connector, connect])

  return (
    <Wrapper>
      <AlertTriangleIcon />
      <ThemedText.HeadlineSmall marginBottom="8px">
        <Trans i18nKey="common.errorConnecting.error" />
      </ThemedText.HeadlineSmall>
      <ThemedText.BodyPrimary fontSize={16} marginBottom={24} lineHeight="24px" textAlign="center">
        <Trans i18nKey="wallet.connectionFailed.message" />
      </ThemedText.BodyPrimary>
      <ButtonPrimary $borderRadius="16px" onClick={retry}>
        <Trans i18nKey="common.tryAgain.error" />
      </ButtonPrimary>
      <ButtonEmpty width="fit-content" padding="0" marginTop={20}>
        <ThemedText.Link onClick={reset} marginBottom={12}>
          <Trans i18nKey="wallet.backToSelection" />
        </ThemedText.Link>
      </ButtonEmpty>
    </Wrapper>
  )
}
