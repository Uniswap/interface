import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useActivePopups } from 'state/application/hooks'
import styled from 'styled-components'
import { Z_INDEX } from 'theme/zIndex'

import { AutoColumn } from '../Column'
import ClaimPopup from './ClaimPopup'
import PopupItem from './PopupItem'

const MobilePopupWrapper = styled.div`
  position: relative;
  max-width: 100%;
  margin: 0 auto;
  display: none;
  padding-left: 20px;
  padding-right: 20px;

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

const FixedPopupColumn = styled(AutoColumn)<{
  drawerOpen: boolean
}>`
  position: fixed;
  top: ${({ drawerOpen }) => `${64 + (drawerOpen ? -50 : 0)}px`};
  right: 1rem;
  max-width: 348px !important;
  width: 100%;
  z-index: ${Z_INDEX.modal};
  transition: ${({ theme }) => `top ${theme.transition.timing.inOut} ${theme.transition.duration.slow}`};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};
`

export default function Popups() {
  const [isAccountDrawerOpen] = useAccountDrawer()

  // get all popups
  const activePopups = useActivePopups()

  return (
    <>
      <FixedPopupColumn gap="20px" drawerOpen={isAccountDrawerOpen} data-testid="popups">
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
