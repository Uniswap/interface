import { ChainId } from '@thinkincoin-libs/sdk-core'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'

import { useActivePopups } from '../../state/application/hooks'
import { useURLWarningVisible } from '../../state/user/hooks'
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

const FixedPopupColumn = styled(AutoColumn)<{ extraPadding: boolean; xlPadding: boolean }>`
  position: fixed;
  top: ${({ extraPadding }) => (extraPadding ? '72px' : '64px')};
  right: 1rem;
  max-width: 348px !important;
  width: 100%;
  z-index: 3;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};

  ${StopOverflowQuery} {
    top: ${({ extraPadding, xlPadding }) => (xlPadding ? '72px' : extraPadding ? '72px' : '64px')};
  }
`

export default function Popups() {
  // get all popups
  const activePopups = useActivePopups()

  const urlWarningActive = useURLWarningVisible()

  // need extra padding if network is not L1 Ethereum
  const { chainId } = useWeb3React()
  const isNotOnMainnet = Boolean(chainId && chainId !== ChainId.MAINNET)

  return (
    <>
      <FixedPopupColumn gap="20px" extraPadding={urlWarningActive} xlPadding={isNotOnMainnet} data-testid="popups">
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
