import { Trans } from '@lingui/macro'
import { AppleLogo } from 'components/Icons/AppleLogo'
import { GooglePlayStoreLogo } from 'components/Icons/GooglePlayStoreLogo'
import Row from 'components/Row'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'

const StyledButton = styled.button`
  height: 40px;
  background: ${({ theme }) => theme.surface1};
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.surface3};
  padding: 8px 16px 8px 12px;
  cursor: pointer;
`
const CallToAction = styled(ThemedText.BodyPrimary)`
  line-height: 20px;
  white-space: nowrap;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: none;
  }
`
export function GetTheAppButton() {
  const theme = useTheme()
  const openModal = useOpenModal(ApplicationModal.GET_THE_APP)

  return (
    <StyledButton onClick={openModal}>
      <Row width="fit-content" gap="12px" align="center">
        <CallToAction data-testid="get-the-app-cta">
          <Trans>Get the app</Trans>
        </CallToAction>
        <AppleLogo fill={theme.neutral1} />
        <GooglePlayStoreLogo />
      </Row>
    </StyledButton>
  )
}
