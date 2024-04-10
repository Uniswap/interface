import { Trans } from '@lingui/macro'
import { useCloseAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { ActivationStatus, useActivationState } from 'connection/activate'
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
export default function ConnectionErrorView() {
  const { activationState, tryActivation, cancelActivation } = useActivationState()
  const closeDrawer = useCloseAccountDrawer()

  if (activationState.status !== ActivationStatus.ERROR) return null

  const retry = () => tryActivation(activationState.connection, closeDrawer)

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
        <ThemedText.Link onClick={cancelActivation} marginBottom={12}>
          <Trans>Back to wallet selection</Trans>
        </ThemedText.Link>
      </ButtonEmpty>
    </Wrapper>
  )
}
