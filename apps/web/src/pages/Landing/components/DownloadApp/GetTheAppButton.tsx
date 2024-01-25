import { Trans } from '@lingui/macro'
import { AppleLogo } from 'components/Icons/AppleLogo'
import { GooglePlayStoreLogo } from 'components/Icons/GooglePlayStoreLogo'
import Row from 'components/Row'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'

import { Wiggle } from '../animations'

const StyledButton = styled.button`
  height: 40px;
  background: ${({ theme }) => theme.surface1};
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.surface3};
  padding: 8px 16px 8px 12px;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.surface2};
  }
`
const CallToAction = styled(ThemedText.BodyPrimary)`
  line-height: 20px;
  white-space: nowrap;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: none;
  }
`

const WiggleIcon = styled(Wiggle)`
  flex: 0;
  height: auto;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
`
export function GetTheAppButton() {
  const theme = useTheme()
  const openModal = useOpenModal(ApplicationModal.GET_THE_APP)

  return (
    <StyledButton onClick={openModal}>
      <Row width="fit-content" gap="12px" align="center" justify="center">
        <CallToAction data-testid="get-the-app-cta">
          <Trans>Get the app</Trans>
        </CallToAction>
        <WiggleIcon>
          <AppleLogo fill={theme.neutral1} />
        </WiggleIcon>
        <WiggleIcon>
          <GooglePlayStoreLogo />
        </WiggleIcon>
      </Row>
    </StyledButton>
  )
}
