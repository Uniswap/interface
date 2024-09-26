import { ButtonEmpty, ButtonPrimary } from 'components/Button/buttons'
import Modal from 'components/Modal'
import { useConnect } from 'hooks/useConnect'
import styled from 'lib/styled-components'
import { useCallback } from 'react'
import { AlertTriangle } from 'react-feather'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap } from 'theme/styles'
import { Trans } from 'uniswap/src/i18n'

const Wrapper = styled.div`
  ${flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 24px;
`

const AlertTriangleIcon = styled(AlertTriangle)`
  width: 48px;
  height: 48px;
  stroke-width: 1.5;
  margin: 36px;
  color: ${({ theme }) => theme.critical};
`

export default function ConnectionErrorView() {
  const connection = useConnect()

  const retry = useCallback(() => {
    const connector = connection?.variables?.connector
    connection?.reset()

    if (!connector) {
      return
    }

    connection?.connect({ connector })
  }, [connection])

  return (
    <Modal isOpen={Boolean(connection?.error)} onDismiss={connection?.reset}>
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
          <ThemedText.BodySecondary color="accent1" onClick={connection?.reset} marginBottom={12}>
            <Trans i18nKey="common.close" />
          </ThemedText.BodySecondary>
        </ButtonEmpty>
      </Wrapper>
    </Modal>
  )
}
