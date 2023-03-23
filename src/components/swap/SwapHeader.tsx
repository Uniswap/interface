import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { StyledXButton } from 'components/TaxServiceModal/TaxServiceBanner'
import { MouseoverTooltipContent } from 'components/Tooltip'
import { bodySmall, subhead } from 'nft/css/common.css'
import { useCallback, useEffect, useState } from 'react'
import { useBuyFiatClicked } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import { useFiatOnrampAvailability, useOpenModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'

const PopupContainer = styled.div<{ show: boolean }>`
  box-shadow: ${({ theme }) => theme.deepShadow};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 13px;
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
  top: 72px;
  width: 376px;
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    border-style: solid none;
    width: 100%;
    border-radius: 0;
    right: auto;
  }
`

const StyledSwapHeader = styled.div`
  padding: 8px 12px;
  margin-bottom: 8px;
  width: 100%;
  color: ${({ theme }) => theme.textSecondary};
`

const Dot = styled.span`
  height: 8px;
  width: 8px;
  background-color: ${({ theme }) => theme.accentActive};
  border-radius: 50%;
  margin: 0px 4px;
  display: inline-block;
`

const TextHeader = styled.div<{ color: string; marginLeft?: string; isClickable?: boolean }>`
  color: ${({ color }) => color};
  margin-left: ${({ marginLeft }) => marginLeft};
  margin-right: 8px;
  display: flex;
  flex-direction: row;
  cursor: ${({ isClickable }) => isClickable && 'pointer'};
  justify-content: center;
  align-items: center;
`

const TOKEN_SAFETY_ARTICLE =
  'https://support.uniswap.org/hc/en-us/articles/11306664890381-Why-isn-t-MoonPay-available-in-my-region-'

export default function SwapHeader({ allowedSlippage }: { allowedSlippage: Percent }) {
  const theme = useTheme()
  const openFiatOnrampModal = useOpenModal(ApplicationModal.FIAT_ONRAMP)
  const [shouldCheck, setShouldCheck] = useState(false)
  const [fiatOnRampUnavailable, setFiatOnRampUnavailable] = useState(false)
  const [buyFiatClicked, setBuyFiatClicked] = useBuyFiatClicked()
  console.log('buyFiatClicked', buyFiatClicked)
  const { available: fiatOnrampAvailable, availabilityChecked: fiatOnrampAvailabilityChecked } =
    useFiatOnrampAvailability(shouldCheck, openFiatOnrampModal)

  const handleBuyCryptoClick = useCallback(() => {
    if (!fiatOnrampAvailabilityChecked) {
      console.log('fiatOnrampAvailabilityChecked', fiatOnrampAvailabilityChecked)
      setShouldCheck(true)
    } else if (fiatOnrampAvailable) {
      openFiatOnrampModal()
      console.log('opening modal, fiatOnrampAvailable ', fiatOnrampAvailable)
      setBuyFiatClicked(true)
    }
  }, [fiatOnrampAvailabilityChecked, fiatOnrampAvailable, openFiatOnrampModal, setBuyFiatClicked])

  useEffect(() => {
    if (fiatOnrampAvailabilityChecked && !fiatOnrampAvailable && !buyFiatClicked) {
      setFiatOnRampUnavailable(true)
      console.log('unavail, fiatOnRampUnavailable', fiatOnRampUnavailable)
      setBuyFiatClicked(true)
    }
  }, [buyFiatClicked, fiatOnRampUnavailable, fiatOnrampAvailabilityChecked, fiatOnrampAvailable, setBuyFiatClicked])

  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <TextHeader className={subhead} color={theme.textPrimary}>
            <Trans>Swap</Trans>
          </TextHeader>
          <MouseoverTooltipContent
            wrap={true}
            content={
              <div>
                <Trans>Crypto purchases are not available in your region. </Trans>
                <ExternalLink href={TOKEN_SAFETY_ARTICLE} style={{ paddingLeft: '4px' }}>
                  <Trans>Learn more</Trans>
                </ExternalLink>
              </div>
            }
            placement="bottom"
            disableHover={!fiatOnrampAvailabilityChecked || fiatOnrampAvailable}
          >
            <TextHeader
              className={subhead}
              color={theme.textSecondary}
              marginLeft="4px"
              isClickable={true}
              onClick={handleBuyCryptoClick}
            >
              <Trans>Buy</Trans>
              {!buyFiatClicked && <Dot />}
            </TextHeader>
          </MouseoverTooltipContent>
        </RowFixed>
        <RowFixed>
          <SettingsTab placeholderSlippage={allowedSlippage} />
        </RowFixed>
      </RowBetween>
      <PopupContainer show={fiatOnRampUnavailable}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <AlertTriangleFilled size="40px" />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '0px 16px',
            }}
          >
            <div className={subhead}>
              <Trans>Unavailable in your region</Trans>
            </div>
            <ExternalLink href={TOKEN_SAFETY_ARTICLE} className={bodySmall}>
              <Trans>Learn more</Trans>
            </ExternalLink>
          </div>
          <StyledXButton
            size={28}
            color={theme.textSecondary}
            onClick={() => {
              setFiatOnRampUnavailable(false)
            }}
          />
        </div>
      </PopupContainer>
    </StyledSwapHeader>
  )
}
