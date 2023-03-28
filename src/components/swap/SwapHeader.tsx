import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { MouseoverTooltipContent } from 'components/Tooltip'
import { useWalletDrawer } from 'components/WalletDropdown'
import { useFiatOnRampButtonEnabled } from 'featureFlags/flags/fiatOnRampButton'
import { subhead } from 'nft/css/common.css'
import { useCallback, useEffect, useState } from 'react'
import { useBuyFiatClicked } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink } from 'theme'

import { useFiatOnrampAvailability, useOpenModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'

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

const TextHeader = styled.div<{ color: string; marginLeft?: string; isClickable?: boolean; disabled?: boolean }>`
  color: ${({ color }) => color};
  opacity: ${({ disabled }) => disabled && '60%'};
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

// TODO(lynnshaoyu): add analytics and logging
// TODO(lynnshaoyu): add animation & timeout to buy fiat unavailable toast
export default function SwapHeader({ allowedSlippage }: { allowedSlippage: Percent }) {
  const theme = useTheme()
  const { account } = useWeb3React()
  const openFiatOnRampModal = useOpenModal(ApplicationModal.FIAT_ONRAMP)
  const fiatOnRampButtonEnabled = useFiatOnRampButtonEnabled()

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

  const disableBuyCryptoButton = Boolean(
    error || (!fiatOnrampAvailable && fiatOnrampAvailabilityChecked) || fiatOnrampAvailabilityLoading
  )

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
  }, [
    openFiatOnRampModal,
    account,
    checkFiatRegionAvailability,
    fiatOnrampAvailabilityChecked,
    fiatOnrampAvailable,
    setBuyFiatClicked,
    toggleWalletDrawer,
    handleBuyCrypto,
    setContinueBuyFiatFlowPostRegionCheck,
    continueBuyFiatFlowPostWalletModal,
    continueBuyFiatFlowPostRegionCheck,
  ])

  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <TextHeader className={subhead} color={theme.textPrimary}>
            <Trans>Swap</Trans>
          </TextHeader>
          {fiatOnRampButtonEnabled && (
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
                marginLeft="8px"
                disabled={disableBuyCryptoButton}
                isClickable={true}
                onClick={handleBuyCrypto}
              >
                <Trans>Buy</Trans>
                {!buyFiatClicked && <Dot />}
              </TextHeader>
            </MouseoverTooltipContent>
          )}
        </RowFixed>
        <RowFixed>
          <SettingsTab placeholderSlippage={allowedSlippage} />
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}
