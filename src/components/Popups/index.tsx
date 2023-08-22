import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'
import { MEDIA_WIDTHS } from 'theme'

import { useActivePopups } from '../../state/application/hooks'
import { useURLWarningVisible } from '../../state/user/hooks'
import { Z_INDEX } from '../../theme/zIndex'
import { useAccountDrawer } from '../AccountDrawer'
import { AutoColumn } from '../Column'
import ClaimPopup from './ClaimPopup'
import PopupItem from './PopupItem'

const MobilePopupWrapper = styled.div`
  position: relative;
  max-width: 100%;
  margin: 0 auto;
  display: none;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
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

const StopOverflowQuery = `@media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToMedium + 1}px) and (max-width: ${
  MEDIA_WIDTHS.deprecated_upToMedium + 500
}px)`

type TopDistanceModifiers = {
  bannerVisible: boolean;
  drawerOpen: boolean;
}

const getTopDistance = ({ drawerOpen, bannerVisible }: TopDistanceModifiers) => {
  return 64 + (drawerOpen ? -50 : 0) + (bannerVisible ? 8 : 0)
}

const FixedPopupColumn = styled(AutoColumn)<TopDistanceModifiers>`
  position: fixed;
  top: ${(modifiers) => `${getTopDistance(modifiers)}px`};
  right: 1rem;
  max-width: 348px !important;
  width: 100%;
  z-index: ${Z_INDEX.modal};
  transition: top ease-in-out 500ms;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};

  ${StopOverflowQuery} {
    top: ${(modifiers) => `${getTopDistance(modifiers)}px`};
  }
`

export default function Popups() {
  const [isAccountDrawerOpen] = useAccountDrawer()
  
  // get all popups
  const activePopups = useActivePopups()

  const urlWarningActive = useURLWarningVisible()

  // need extra padding if network is not L1 Ethereum
  const { chainId } = useWeb3React()
  const isNotOnMainnet = Boolean(chainId && chainId !== ChainId.MAINNET)

  return (
    <>
      <FixedPopupColumn gap="20px" drawerOpen={isAccountDrawerOpen} bannerVisible={isNotOnMainnet || urlWarningActive} data-testid="popups">
        <ClaimPopup />
        {activePopups.map((item) => (
          <PopupItem key={item.key} content={item.content} popKey={item.key} removeAfterMs={item.removeAfterMs} />
        ))}
      </FixedPopupColumn>
      {activePopups?.length > 0 && (
        <MobilePopupWrapper data-testid="popups">
          <MobilePopupInner>
            {activePopups // reverse so new items up front
              .slice(0)
              .reverse()
              .map((item) => (
                <PopupItem key={item.key} content={item.content} popKey={item.key} removeAfterMs={item.removeAfterMs} />
              ))}
          </MobilePopupInner>
        </MobilePopupWrapper>
      )}
    </>
  )
}
