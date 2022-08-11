import CopyHelper from 'components/AccountDetails/Copy'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { darken } from 'polished'
import { useRef } from 'react'
import { Twitter } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components/macro'
import { ClickableStyle, Z_INDEX } from 'theme'

import { ReactComponent as ShareIcon } from '../../../assets/svg/share.svg'

const TWITTER_WIDTH = 560
const TWITTER_HEIGHT = 480

const ShareButtonDisplay = styled.div`
  display: flex;
  cursor: pointer;
  position: relative;
  z-index: ${Z_INDEX.dropdown};

  &:hover {
    color: ${({ theme }) => darken(0.1, theme.textSecondary)};
  }
`

const Share = styled(ShareIcon)<{ open: boolean }>`
  width: 18px;
  height: 18px;
  :hover {
    opacity: 0.6;
  }
  ${({ open }) => open && `opacity: 0.4 !important`};
`

const ShareActions = styled.div`
  position: absolute;
  width: 240px;
  height: 96px;
  top: 28px;
  right: 0px;
  justify-content: center;
  display: flex;
  flex-direction: column;
  overflow: auto;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: 0.5px solid ${({ theme }) => theme.backgroundOutline};
  box-shadow: ${({ theme }) => theme.flyoutDropShadow};
  border-radius: 12px;
`
const ShareAction = styled.div<{ highlighted?: boolean }>`
  ${({ highlighted }) => highlighted && ClickableStyle};
  display: flex;
  align-items: center;
  padding: 8px;
  margin: 0 8px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 400;
  gap: 0.75rem;
  height: 40px;
  color: ${({ theme }) => theme.textPrimary};
  background-color: ${({ theme, highlighted }) => (highlighted ? theme.backgroundInteractive : 'transparent')};
  cursor: pointer;
`

interface TokenInfo {
  tokenName: string
  tokenSymbol: string
}

export default function ShareButton(tokenInfo: TokenInfo) {
  const theme = useTheme()
  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.SHARE)
  const toggleShare = useToggleModal(ApplicationModal.SHARE)
  useOnClickOutside(node, open ? toggleShare : undefined)
  const positionX = (window.screen.width - TWITTER_WIDTH) / 2
  const positionY = (window.screen.height - TWITTER_HEIGHT) / 2

  const shareTweet = () => {
    toggleShare()
    window.open(
      `https://twitter.com/intent/tweet?text=Check%20out%20${tokenInfo.tokenName}%20(${tokenInfo.tokenSymbol})%20https://app.uniswap.org/%23/tokens/${tokenInfo.tokenSymbol}%20via%20@uniswap`,
      'newwindow',
      `left=${positionX}, top=${positionY}, width=${TWITTER_WIDTH}, height=${TWITTER_HEIGHT}`
    )
  }

  return (
    <ShareButtonDisplay ref={node}>
      <Share onClick={toggleShare} aria-label={`ShareOptions`} open={open} />
      {open && (
        <ShareActions>
          <ShareAction>
            <CopyHelper color={theme.textPrimary} iconPosition="left" toCopy={window.location.href}>
              Copy Link
            </CopyHelper>
          </ShareAction>

          <ShareAction onClick={shareTweet} highlighted>
            <Twitter color={theme.textSecondary} size={20} strokeWidth={1.5} />
            Share to Twitter
          </ShareAction>
        </ShareActions>
      )}
    </ShareButtonDisplay>
  )
}
