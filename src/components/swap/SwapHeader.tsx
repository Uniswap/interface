import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { MouseoverTooltipContent } from 'components/Tooltip'
import { useWalletDrawer } from 'components/WalletDropdown'
import { Row } from 'nft/components/Flex'
import { bodySmall, subhead } from 'nft/css/common.css'
import { useCallback, useEffect, useState } from 'react'
import { X } from 'react-feather'
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
  border-radius: 16px;
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

const StyledXButton = styled(X)`
  color: ${({ theme }) => theme.textPrimary};
  cursor: pointer;
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  &:active {
    opacity: ${({ theme }) => theme.opacity.click};
  }
`

const TOKEN_SAFETY_ARTICLE =
  'https://support.uniswap.org/hc/en-us/articles/11306664890381-Why-isn-t-MoonPay-available-in-my-region-'

const MAX_FIAT_ON_RAMP_UNAVAILABLE_TOAST_RENDER_COUNT = 1

// TODO(lynnshaoyu): add analytics and logging
export default function SwapHeader({ allowedSlippage }: { allowedSlippage: Percent }) {
  const theme = useTheme()

  const { account } = useWeb3React()

  const openFiatOnRampModal = useOpenModal(ApplicationModal.FIAT_ONRAMP)
  const openFiatOnRampModalLocal = useCallback(() => {
    setShouldOpenFiatOnRampModal(false)
    openFiatOnRampModal()
  }, [openFiatOnRampModal])

  const [shouldOpenFiatOnRampModal, setShouldOpenFiatOnRampModal] = useState(false)

  const [fiatOnRampUnavailableRenderCount, setFiatOnRampUnavailableRenderCount] = useState(0)
  const [buyFiatClicked, setBuyFiatClicked] = useBuyFiatClicked()

  const [shouldCheck, setShouldCheck] = useState(false)
  const { available: fiatOnrampAvailable, availabilityChecked: fiatOnrampAvailabilityChecked } =
    useFiatOnrampAvailability(shouldCheck, openFiatOnRampModalLocal)

  const [, toggleWalletDrawer] = useWalletDrawer()

  const handleBuyCryptoClick = useCallback(() => {
    if (!account) {
      toggleWalletDrawer()
      setShouldOpenFiatOnRampModal(true)
    } else if (!fiatOnrampAvailabilityChecked) {
      setShouldCheck(true)
    } else if (fiatOnrampAvailable) {
      openFiatOnRampModalLocal()
    }
    setBuyFiatClicked(true)
  }, [
    account,
    setShouldCheck,
    fiatOnrampAvailabilityChecked,
    fiatOnrampAvailable,
    openFiatOnRampModalLocal,
    setBuyFiatClicked,
    toggleWalletDrawer,
  ])

  useEffect(() => {
    if (shouldOpenFiatOnRampModal && account && !fiatOnrampAvailabilityChecked) {
      setShouldCheck(true)
    } else if (shouldOpenFiatOnRampModal && account && fiatOnrampAvailabilityChecked && fiatOnrampAvailable) {
      openFiatOnRampModalLocal()
    }
  }, [
    openFiatOnRampModalLocal,
    shouldOpenFiatOnRampModal,
    account,
    setShouldCheck,
    fiatOnrampAvailabilityChecked,
    fiatOnrampAvailable,
    setBuyFiatClicked,
  ])

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
      <PopupContainer
        show={
          !fiatOnrampAvailable &&
          fiatOnrampAvailabilityChecked &&
          fiatOnRampUnavailableRenderCount < MAX_FIAT_ON_RAMP_UNAVAILABLE_TOAST_RENDER_COUNT
        }
      >
        <RowBetween
          style={{
            alignItems: 'start',
            padding: '16px',
          }}
        >
          <Row>
            <AlertTriangleFilled size="40px" />
            <Column
              style={{
                padding: '0px 16px',
              }}
            >
              <div className={subhead}>
                <Trans>Unavailable in your region</Trans>
              </div>
              <ExternalLink href={TOKEN_SAFETY_ARTICLE} className={bodySmall}>
                <Trans>Learn more</Trans>
              </ExternalLink>
            </Column>
          </Row>
          <StyledXButton
            size={22}
            color={theme.textSecondary}
            onClick={() => {
              setFiatOnRampUnavailableRenderCount(fiatOnRampUnavailableRenderCount + 1)
            }}
          />
        </RowBetween>
      </PopupContainer>
    </StyledSwapHeader>
  )
}
