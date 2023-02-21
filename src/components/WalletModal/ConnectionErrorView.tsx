import { Trans } from '@lingui/macro'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
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
  color: ${({ theme }) => theme.accentCritical};
`

export default function ConnectionErrorView({
  retryActivation,
  openOptions,
}: {
  retryActivation: () => void
  openOptions: () => void
}) {
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
      <ButtonPrimary $borderRadius="16px" onClick={retryActivation}>
        <Trans>Try Again</Trans>
      </ButtonPrimary>
      <ButtonEmpty width="fit-content" padding="0" marginTop={20}>
        <ThemedText.Link onClick={openOptions} marginBottom={12}>
          <Trans>Back to wallet selection</Trans>
        </ThemedText.Link>
      </ButtonEmpty>
    </Wrapper>
  )
}
