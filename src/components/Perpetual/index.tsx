import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import { ReactComponent as Close } from '../../assets/images/x.svg'
import { CloseIcon, ExternalLink, TYPE } from '../../theme'
import { CardSection } from '../earn/styled'
import Modal from '../Modal'
import { RowBetween, RowFixed } from '../Row'

const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text1};
  }
`

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const PerpText = styled(TYPE.body)`
  color: ${({ theme }) => theme.text1};
`

export const StyledInput = styled.input`
  cursor: pointer;
  width: 18px;
  height: 18px;
  margin-right: 10px;
  accent-color: ${({ theme }) => theme.primary1};
  border-radius: 20px;
  outline: none;
`

export default function PerpModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  const [checked, setChecked] = useState(false)

  const handleChange = () => setChecked(!checked)

  const perpRedirectionHandler = () => {
    if (checked) localStorage.setItem('KromTOUTicked', Date.now().toString())
    onDismiss()
    window.open('https://perp.kromatika.finance/', '_blank')
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      <ContentWrapper gap="lg">
        <CardSection gap="md">
          <RowBetween>
            <TYPE.subHeader>
              <Trans>Launch Perpetual Trading</Trans>
            </TYPE.subHeader>
            <CloseIcon onClick={onDismiss}>
              <CloseColor />
            </CloseIcon>
          </RowBetween>
        </CardSection>
        <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0' }} justify="center">
          <PerpText>
            <Trans>
              You are leaving Kromatika.Finance and will be redirected to an independent third-party website.
            </Trans>
            <br />
            <br />
            <Trans>The Perpetual Trading is currently in beta-stage. Trade at your own risk.</Trans>
            <br />
            <br />
            <Trans>
              Some countries may not be allowed to use perpetual trading - see the details under section 2 within our
              terms of use.
            </Trans>
          </PerpText>
        </AutoColumn>
        <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0' }} justify="center">
          <PerpText>
            <RowFixed>
              <StyledInput type="checkbox" checked={checked} onChange={handleChange} />
              <Trans>Don&apos;t show this message again for the next 30 days.</Trans>
            </RowFixed>
            <Trans>
              <br />
              <br />
              By clicking &quot;Agree&quot; you accept the&nbsp;
              <ExternalLink href="https://kromatika.finance/terms-of-use" target="_blank">
                Terms and Conditions&nbsp;
              </ExternalLink>
              by Kromatika.Finance
              <br />
              <br />
            </Trans>
          </PerpText>

          <ButtonPrimary
            padding="16px 16px"
            width="100%"
            $borderRadius="20px"
            mt="1rem"
            onClick={perpRedirectionHandler}
          >
            <Text fontWeight={700}>
              <Trans>Agree</Trans>
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      </ContentWrapper>
    </Modal>
  )
}
