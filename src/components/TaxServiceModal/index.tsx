import { Trans } from '@lingui/macro'
import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { ButtonEmphasis } from 'components/Button'
import { ButtonSize, ThemeButton } from 'components/Button'
import { Box } from 'nft/components/Box'
import { bodySmall, subhead } from 'nft/css/common.css'
import { memo } from 'react'
import styled from 'styled-components/macro'

import Modal from '../Modal'
import CointrackerFullLogo from './CointrackerFullLogo.png'
import { StyledXButton } from './TaxServiceBanner'
import TokenTaxFullLogo from './TokenTaxFullLogo.png'

interface TaxServiceModalProps {
  isOpen: boolean
  onDismiss: () => void
}

interface TaxServiceOptionProps {
  logo: any
  description: string
  url: string
}

const InnerContainer = styled.div`
  background-color: ${({ theme }) => theme.backgroundSurface};
  overflow: hidden;
  display: flex;
  width: 420px;
  height: 268px;
  flex-direction: column;
  position: relative;
  gap: 20px;
  padding: 16px;
`

const TaxOptionContainer = styled.div`
  display: flex;
  flex: 1;
  gap: 16px;
  justify-content: center;
`

const TaxOptionDescription = styled.div`
  display: flex;
  height: 100%;
  justify-content: center;
  user-select: none;
  text-align: center;
`

const TaxOption = styled.div`
  align-items: center;
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: 12px;
  cursor: auto;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
  padding: 12px;
  gap: 16px;
`

const StyledImageContainer = styled(Box)`
  width: 75%;
  height: 80%;
  cursor: auto;
  object-fit: contain;
`

const Button = styled(ThemeButton)`
  cursor: pointer;
  width: 100%;
  margin-right: auto;
`

const TOKEN_TAX_URL = 'https://tokentax.co/uniswap?via=uniswap'
const COINTRACKER_URL = 'https://www.cointracker.io/partner/uniswap?utm_source=uniswap'

const TOKEN_TAX_DESCRIPTION = 'Save 10% on all plans'
const COINTRACKER_DESCRIPTION = 'New and existing users save up to 20%'

function TaxServiceOption({ description, logo, url }: TaxServiceOptionProps) {
  const openTaxServiceLink = () => {
    window.open(url, '_blank')
  }

  return (
    <TaxOption tabIndex={0}>
      <StyledImageContainer as="img" src={logo} draggable={false} />
      <TaxOptionDescription className={bodySmall}>{description}</TaxOptionDescription>
      <TraceEvent
        events={[BrowserEvent.onClick]}
        name={SharedEventName.ELEMENT_CLICKED}
        element={
          url.includes('tokentax')
            ? InterfaceElementName.TAX_SERVICE_TOKENTAX_BUTTON
            : InterfaceElementName.TAX_SERVICE_COINTRACKER_BUTTON
        }
      >
        <Button
          size={ButtonSize.medium}
          emphasis={ButtonEmphasis.medium}
          onClick={openTaxServiceLink}
          data-testid="tax-service-option-button"
        >
          Get started
        </Button>
      </TraceEvent>
    </TaxOption>
  )
}

export default memo(function TaxServiceModal({ isOpen, onDismiss }: TaxServiceModalProps) {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} minHeight={false}>
      <InnerContainer>
        <div style={{ display: 'flex', justifyContent: 'space-between', userSelect: 'none' }}>
          <div className={subhead}>
            <Trans>Save on your crypto taxes</Trans>
          </div>
          <StyledXButton size={20} onClick={onDismiss} />
        </div>
        <TaxOptionContainer>
          <TaxServiceOption description={COINTRACKER_DESCRIPTION} logo={CointrackerFullLogo} url={COINTRACKER_URL} />
          <TaxServiceOption description={TOKEN_TAX_DESCRIPTION} logo={TokenTaxFullLogo} url={TOKEN_TAX_URL} />
        </TaxOptionContainer>
      </InnerContainer>
    </Modal>
  )
})
