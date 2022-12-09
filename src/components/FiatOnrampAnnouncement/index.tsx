import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import fiatMaskUrl from 'assets/svg/fiat_mask.svg'
import { BaseVariant } from 'featureFlags'
import { useFiatOnrampFlag } from 'featureFlags/flags/fiatOnramp'
import { useCallback, useEffect, useState } from 'react'
import { X } from 'react-feather'
import { useToggleWalletDropdown } from 'state/application/hooks'
import { useFiatOnrampAck } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

const Arrow = styled.div`
  top: -4px;
  height: 16px;
  position: absolute;
  right: 16px;
  width: 16px;

  ::before {
    background: hsl(315.75, 93%, 83%);
    border-top: none;
    border-left: none;
    box-sizing: border-box;
    content: '';
    height: 16px;
    position: absolute;
    transform: rotate(45deg);
    width: 16px;
  }
`
const ArrowWrapper = styled.div`
  position: absolute;
  right: 16px;
  top: 90%;
  width: 100%;
  max-width: 320px;
  min-height: 92px;
  z-index: ${Z_INDEX.dropdown - 1};

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    right: 36px;
  }
`

const CloseIcon = styled(X)`
  color: white;
  cursor: pointer;
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
`
const Wrapper = styled.button`
  background: radial-gradient(105% 250% at 100% 5%, hsla(318, 95%, 85%) 1%, hsla(331, 80%, 75%, 0.1) 84%),
    linear-gradient(180deg, hsla(296, 92%, 67%, 0.5) 0%, hsla(313, 96%, 60%, 0.5) 130%);
  background-color: hsla(297, 93%, 68%, 1);
  border-radius: 12px;
  border: none;
  cursor: pointer;
  outline: none;
  overflow: hidden;
  position: relative;
  text-align: start;
  max-width: 320px;
  min-height: 92px;
  width: 100%;

  :before {
    background-image: url(${fiatMaskUrl});
    background-repeat: no-repeat;
    content: '';
    height: 100%;
    position: absolute;
    right: -154px; // roughly width of fiat mask image
    top: 0;
    width: 100%;
  }
`

const Header = styled(ThemedText.SubHeader)`
  color: white;
  margin: 0;
  padding: 12px 12px 4px;
  position: relative;
`
const Body = styled(ThemedText.BodySmall)`
  color: white;
  margin: 0 12px 12px 12px !important;
  position: relative;
`

const ANNOUNCEMENT_RENDERED = 'FiatOnrampAnnouncement-rendered'
const ANNOUNCEMENT_DISMISSED = 'FiatOnrampAnnouncement-dismissed'

const MAX_RENDER_COUNT = 3
export function FiatOnrampAnnouncement() {
  const { account } = useWeb3React()
  const [acks, acknowledge] = useFiatOnrampAck()
  const [locallyDismissed, setLocallyDismissed] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(ANNOUNCEMENT_RENDERED)) {
      acknowledge({ renderCount: acks.renderCount + 1 })
      sessionStorage.setItem(ANNOUNCEMENT_RENDERED, 'true')
    }
  }, [acknowledge, acks.renderCount])

  const handleClose = useCallback(() => {
    setLocallyDismissed(true)
    sessionStorage.setItem(ANNOUNCEMENT_DISMISSED, 'true')
  }, [])

  const toggleWalletDropdown = useToggleWalletDropdown()
  const handleClick = useCallback(() => {
    toggleWalletDropdown()
    acknowledge({ user: true })
  }, [acknowledge, toggleWalletDropdown])
  const fiatOnrampFlag = useFiatOnrampFlag()

  if (
    !account ||
    acks?.user ||
    fiatOnrampFlag === BaseVariant.Control ||
    locallyDismissed ||
    sessionStorage.getItem(ANNOUNCEMENT_DISMISSED) ||
    acks.renderCount >= MAX_RENDER_COUNT
  ) {
    return null
  }
  return (
    <ArrowWrapper>
      <Arrow />
      <CloseIcon onClick={handleClose} />
      <Wrapper onClick={handleClick}>
        <Header>
          <Trans>Buy crypto</Trans>
        </Header>
        <Body>
          <Trans>Get the lowest rates on the market on Uniswap with Moonpay.</Trans>
        </Body>
      </Wrapper>
    </ArrowWrapper>
  )
}
