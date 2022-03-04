import { SupportedChainId } from 'constants/chains'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'

import { useActivePopups } from '../../state/application/hooks'
import { useShowDonationLink, useURLWarningVisible } from '../../state/user/hooks'
import { AutoColumn } from '../Column'
import ClaimPopup from './ClaimPopup'
import DonationLink from './DonationLink'
import PopupItem from './PopupItem'

const MobilePopupWrapper = styled.div<{ height: string | number }>`
  position: relative;
  max-width: 100%;
  height: ${({ height }) => height};
  margin: ${({ height }) => (height ? '0 auto;' : 0)};
  margin-bottom: ${({ height }) => (height ? '20px' : 0)};

  display: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: block;
    padding-top: 20px;
  `};
`

const MobilePopupInner = styled.div`
  height: 99%;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: row;
  -webkit-overflow-scrolling: touch;
  ::-webkit-scrollbar {
    display: none;
  }
`

const StopOverflowQuery = `@media screen and (min-width: ${MEDIA_WIDTHS.upToMedium + 1}px) and (max-width: ${
  MEDIA_WIDTHS.upToMedium + 500
}px)`

const FixedPopupColumn = styled(AutoColumn)<{ extraPadding: boolean; xlPadding: boolean }>`
  position: fixed;
  top: ${({ extraPadding }) => (extraPadding ? '64px' : '56px')};
  right: 1rem;
  max-width: 355px !important;
  width: 100%;
  z-index: 3;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};

  ${StopOverflowQuery} {
    top: ${({ extraPadding, xlPadding }) => (xlPadding ? '64px' : extraPadding ? '64px' : '56px')};
  }
`

export default function Popups() {
  // get all popups
  const activePopups = useActivePopups()

  const urlWarningActive = useURLWarningVisible()

  // need extra padding if network is not L1 Ethereum
  const { chainId } = useActiveWeb3React()
  const isNotOnMainnet = Boolean(chainId && chainId !== SupportedChainId.MAINNET)

  const location = useLocation()
  const isOnSwapPage = location.pathname.includes('swap')
  const [donationVisible] = useShowDonationLink()
  const showDonation = donationVisible && isOnSwapPage

  return (
    <>
      <FixedPopupColumn gap="20px" extraPadding={urlWarningActive} xlPadding={isNotOnMainnet}>
        <ClaimPopup />
        {activePopups.map((item) => (
          <PopupItem key={item.key} content={item.content} popKey={item.key} removeAfterMs={item.removeAfterMs} />
        ))}
        {showDonation ? <DonationLink /> : null}
      </FixedPopupColumn>
      <MobilePopupWrapper height={activePopups?.length > 0 || showDonation ? 'fit-content' : 0}>
        <MobilePopupInner>
          {showDonation ? <DonationLink /> : null}
          {activePopups // reverse so new items up front
            .slice(0)
            .reverse()
            .map((item) => (
              <PopupItem key={item.key} content={item.content} popKey={item.key} removeAfterMs={item.removeAfterMs} />
            ))}
        </MobilePopupInner>
      </MobilePopupWrapper>
    </>
  )
}
