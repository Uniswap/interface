import { Trans } from '@lingui/macro'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import { LARGE_MEDIA_BREAKPOINT, MOBILE_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { bodySmall, subhead } from 'nft/css/common.css'
import { useState } from 'react'
import { useCallback } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'

import TaxServiceModal from '.'
import CointrackerLogo from './CointrackerLogo.png'
import TokenTaxLogo from './TokenTaxLogo.png'

const PopupContainer = styled.div<{ show: boolean }>`
  background-image: url(${CointrackerLogo}), url(${TokenTaxLogo});
  background-size: 15%, 20%;
  background-repeat: no-repeat;
  background-position: top right 75px, bottom 5px right 7px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: ${({ theme }) => theme.deepShadow};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  cursor: pointer;
  color: ${({ theme }) => theme.textPrimary};
  display: ${({ show }) => (show ? 'flex' : 'none')};
  flex-direction: column;
  position: fixed;
  right: clamp(0px, 1vw, 16px);
  z-index: ${Z_INDEX.sticky};
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `${duration.slow} opacity ${timing.in}`};
  width: 320px;
  height: 156px;
  @media screen and (min-width: ${LARGE_MEDIA_BREAKPOINT}) {
    bottom: 48px;
  }
  @media screen and (min-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    width: 320px;
  }
  :hover {
    border: double 1px transparent;
    border-radius: 12px;
    background-origin: border-box;
    background-clip: padding-box, border-box;
  }
`

const Button = styled(ThemeButton)`
  margin-top: auto;
  margin-right: auto;
  padding: 8px 24px;
  gap: 8px;
  border-radius: 12px;
`

const InnerContainer = styled.div`
  background-color: ${({ theme }) => theme.accentActionSoft};
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  gap: 8px;
  padding: 16px;
`

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 70%;
  justify-content: center;
`

export const StyledXButton = styled(X)`
  color: ${({ theme }) => theme.accentTextLightPrimary};
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  &:active {
    opacity: ${({ theme }) => theme.opacity.click};
  }
`

const TAX_SERVICE_DISMISSED = 'TaxServiceToast-dismissed'

export default function TaxServiceBanner() {
  const [modalOpen, setModalOpen] = useState(false)
  const sessionStorageTaxServiceDismissed = sessionStorage.getItem(TAX_SERVICE_DISMISSED)
  let initialBannerOpen = true
  if (!sessionStorageTaxServiceDismissed) {
    sessionStorage.setItem(TAX_SERVICE_DISMISSED, 'false')
  } else if (sessionStorageTaxServiceDismissed === 'true') {
    initialBannerOpen = false
  }
  const [bannerOpen, setBannerOpen] = useState(initialBannerOpen)
  const onDismiss = () => {
    setModalOpen(false)
  }

  const toggleTaxModal = () => {
    setModalOpen(true)
  }

  const handleClose = useCallback(() => {
    setBannerOpen(false)
    sessionStorage.setItem(TAX_SERVICE_DISMISSED, 'true')
  }, [])

  return (
    <PopupContainer show={bannerOpen}>
      <InnerContainer>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <TextContainer>
            <div className={subhead} style={{ paddingBottom: '12px' }}>
              <Trans>Save on your crypto taxes</Trans>
            </div>
            <div className={bodySmall} style={{ paddingBottom: '12px' }}>
              <Trans>Get up to a 20% discount on CoinTracker or TokenTax.</Trans>{' '}
            </div>
          </TextContainer>
          <StyledXButton
            size={20}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleClose()
            }}
          />
        </div>

        <Button size={ButtonSize.small} emphasis={ButtonEmphasis.promotional} onClick={toggleTaxModal}>
          <Trans>Learn more</Trans>
        </Button>
      </InnerContainer>
      <TaxServiceModal isOpen={modalOpen} onDismiss={onDismiss} />
    </PopupContainer>
  )
}
