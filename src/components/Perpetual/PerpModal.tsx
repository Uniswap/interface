import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { Checkbox, PaddedColumn, TextDot } from 'components/SearchModal/styleds'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'

import { CloseIcon, CustomLightSpinner, ExternalLink, TYPE } from '../../theme'
import { Break, CardSection, DataCard } from '../earn/styled'
import Modal from '../Modal'
import { RowBetween } from '../Row'

export default function PerpModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  function wrappedOnDismiss() {
    onDismiss()
  }

  const ModalUpper: any = styled(DataCard)`
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    background: radial-gradient(76.02% 75.41% at 1.84% 0%, #ff007a 0%, #021d43 100%);
  `

  const ContentWrapper = styled(AutoColumn)`
    width: 100%;
  `

  const PerpRedirectionHandler = () => {
    // Check if checkbox is ticked
    if (checked) {
      // We need to write into localStorage the date of the checkbox checking event
      localStorage.setItem('KromTOUTicked', Date.now().toString())
    }
    // External redirection
    window.open('https://perp.kromatika.finance/', '_blank')
  }

  const [checked, setChecked] = useState(false)
  const handleChange = () => {
    setChecked(!checked)
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      <ContentWrapper gap="lg">
        <ModalUpper>
          <CardSection gap="md">
            <RowBetween>
              <TYPE.white fontWeight={500}>
                <Trans>Launch Perpetual Trading</Trans>
              </TYPE.white>
              <CloseIcon onClick={wrappedOnDismiss} style={{ zIndex: 99 }} stroke="white" />
            </RowBetween>
          </CardSection>
        </ModalUpper>

        <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0' }} justify="center">
          <TYPE.white fontWeight={500}>
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
          </TYPE.white>
        </AutoColumn>
        <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0' }} justify="center">
          <TYPE.subHeader fontWeight={500}>
            <input type="checkbox" checked={checked} onChange={handleChange} />
            Don&apos;t show this message again for the next 30 days.
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
          </TYPE.subHeader>

          <ButtonPrimary
            padding="16px 16px"
            width="100%"
            $borderRadius="12px"
            mt="1rem"
            onClick={() => PerpRedirectionHandler()}
          >
            <Trans>Agree</Trans>
          </ButtonPrimary>
        </AutoColumn>
      </ContentWrapper>
    </Modal>
  )
}
