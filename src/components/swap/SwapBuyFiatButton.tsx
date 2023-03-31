import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ButtonText } from 'components/Button'
import { MouseoverTooltipContent } from 'components/Tooltip'
import { useWalletDrawer } from 'components/WalletDropdown'
import { useCallback, useEffect, useState } from 'react'
import { useBuyFiatClicked } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink } from 'theme'

import { useFiatOnrampAvailability, useOpenModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'

const Dot = styled.div`
  height: 8px;
  width: 8px;
  background-color: ${({ theme }) => theme.accentActive};
  border-radius: 50%;
`

const MOONPAY_REGION_AVAILABILITY_ARTICLE =
  'https://support.uniswap.org/hc/en-us/articles/11306664890381-Why-isn-t-MoonPay-available-in-my-region-'

enum BuyFiatFlowState {
  REGION_AVAILABILITY_UNKNOWN,
  UNCONNECTED_ACCOUNT,
  AVAILABLE_IN_REGION,
  UNAVAILABLE_IN_REGION,
}

export default function SwapBuyFiatButton() {
  const theme = useTheme()
  const { account } = useWeb3React()
  const openFiatOnRampModal = useOpenModal(ApplicationModal.FIAT_ONRAMP)
  const [buyFiatClicked, setBuyFiatClicked] = useBuyFiatClicked()
  const [continueBuyFiatFlowPostRegionCheck, setContinueBuyFiatFlowPostRegionCheck] = useState(false)
  const [continueBuyFiatFlowPostWalletModal, setContinueBuyFiatFlowPostWalletModal] = useState(false)
  const [checkFiatRegionAvailability, setCheckFiatRegionAvailability] = useState(false)
  const {
    available: fiatOnrampAvailable,
    availabilityChecked: fiatOnrampAvailabilityChecked,
    error,
    loading: fiatOnrampAvailabilityLoading,
  } = useFiatOnrampAvailability(checkFiatRegionAvailability)
  // const [buyFiatFlowState, setBuyFiatFlowState] = useState(BuyFiatFlowState.REGION_AVAILABILITY_UNKNOWN)
  const [walletDrawerOpen, toggleWalletDrawer] = useWalletDrawer()

  const handleBuyCrypto = useCallback(() => {
    if (!fiatOnrampAvailabilityChecked) {
      setCheckFiatRegionAvailability(true)
      setContinueBuyFiatFlowPostRegionCheck(true)
    } else if (fiatOnrampAvailable && !account && !walletDrawerOpen) {
      toggleWalletDrawer()
      setContinueBuyFiatFlowPostRegionCheck(false)
      setContinueBuyFiatFlowPostWalletModal(true)
    } else if (fiatOnrampAvailable && account) {
      openFiatOnRampModal()
      setBuyFiatClicked(true)
      setContinueBuyFiatFlowPostRegionCheck(false)
      setContinueBuyFiatFlowPostWalletModal(false)
    } else if (!fiatOnrampAvailable) {
      setBuyFiatClicked(true)
      setContinueBuyFiatFlowPostRegionCheck(false)
      setContinueBuyFiatFlowPostWalletModal(false)
    }
  }, [
    walletDrawerOpen,
    fiatOnrampAvailabilityChecked,
    fiatOnrampAvailable,
    account,
    toggleWalletDrawer,
    openFiatOnRampModal,
    setBuyFiatClicked,
  ])

  useEffect(() => {
    if (continueBuyFiatFlowPostRegionCheck || (account && continueBuyFiatFlowPostWalletModal)) {
      handleBuyCrypto()
    }
  }, [account, handleBuyCrypto, continueBuyFiatFlowPostWalletModal, continueBuyFiatFlowPostRegionCheck])

  const disableBuyCryptoButton = Boolean(
    (!fiatOnrampAvailable && fiatOnrampAvailabilityChecked) || fiatOnrampAvailabilityLoading
  )

  useEffect(() => {
    if (error) console.error(error)
  }, [error])

  return (
    <MouseoverTooltipContent
      wrap
      delayBeforeShow={500}
      content={
        <div>
          <Trans>Crypto purchases are not available in your region. </Trans>
          <ExternalLink href={MOONPAY_REGION_AVAILABILITY_ARTICLE} style={{ paddingLeft: '4px' }}>
            <Trans>Learn more</Trans>
          </ExternalLink>
        </div>
      }
      placement="bottom"
      disableHover={!fiatOnrampAvailabilityChecked || fiatOnrampAvailable}
    >
      <ButtonText
        onClick={handleBuyCrypto}
        color={theme.textSecondary}
        noUnderline={true}
        disabled={disableBuyCryptoButton}
        style={{ gap: '4px' }}
      >
        <Trans>Buy</Trans>
        {!buyFiatClicked && <Dot />}
      </ButtonText>
    </MouseoverTooltipContent>
  )
}
