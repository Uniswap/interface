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
    if (!connector) return

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
        <Trans>Error connecting</Trans>
      </ThemedText.HeadlineSmall>
      <ThemedText.BodyPrimary fontSize={16} marginBottom={24} lineHeight="24px" textAlign="center">
        <Trans>
          The connection attempt failed. Please click try again and follow the steps to connect in your wallet.
        </Trans>
      </ThemedText.BodyPrimary>
      <ButtonPrimary $borderRadius="16px" onClick={retry}>
        <Trans>Try again</Trans>
      </ButtonPrimary>
      <ButtonEmpty width="fit-content" padding="0" marginTop={20}>
        <ThemedText.Link onClick={reset} marginBottom={12}>
          <Trans>Back to wallet selection</Trans>
        </ThemedText.Link>
      </ButtonEmpty>
    </Wrapper>
  )
}
