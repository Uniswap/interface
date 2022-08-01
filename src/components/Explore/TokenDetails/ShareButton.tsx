import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { darken } from 'polished'
import { useRef, useState } from 'react'
import { Check, Link, Share, Twitter } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components/macro'

const TWITTER_WIDTH = 560
const TWITTER_HEIGHT = 480

const ShareButtonDisplay = styled.div`
  display: flex;
  cursor: pointer;
  position: relative;

  &:hover {
    color: ${({ theme }) => darken(0.1, theme.textSecondary)};
  }
`
const ShareActions = styled.div`
  position: absolute;
  top: 28px;
  right: 0px;
  padding: 8px 0px;
  display: flex;
  flex-direction: column;
  width: fit-content;
  overflow: auto;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  box-shadow: ${({ theme }) => theme.flyoutDropShadow};
  border-radius: 12px;
`
const ShareAction = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-size: 16px;
  gap: 8px;
  width: 200px;
  height: 48px;
  color: ${({ theme }) => theme.textPrimary};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.backgroundContainer};
  }
`

const LinkCopied = styled.div<{ show: boolean }>`
  display: ${({ show }) => (show ? 'flex' : 'none')};
  width: 328px;
  height: 72px;
  color: ${({ theme }) => theme.textPrimary};
  background-color: ${({ theme }) => theme.backgroundBackdrop};
  justify-content: flex-start;
  align-items: center;
  padding: 24px 16px;
  position: absolute;
  right: 32px;
  bottom: 32px;
  font-size: 14px;
  gap: 8px;
  border: 1px solid rgba(153, 161, 189, 0.08);
  box-shadow: ${({ theme }) => theme.flyoutDropShadow};
  border-radius: 20px;
  animation: floatIn 0s ease-in 3s forwards;

  @keyframes floatIn {
    to {
      width: 0;
      height: 0;
      overflow: hidden;
      display: none;
    }
  }
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
  const [showCopied, setShowCopied] = useState(false)
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
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(
      function handleClipboardWriteSuccess() {
        setShowCopied(true)
        toggleShare()
        setTimeout(() => setShowCopied(false), 3000)
      },
      function error() {
        console.error('Clipboard copy failed.')
      }
    )
  }

  return (
    <>
      <ShareButtonDisplay ref={node}>
        <Share size={18} onClick={toggleShare} aria-label={`ShareOptions`} />
        {open && (
          <ShareActions>
            <ShareAction onClick={copyLink}>
              <Link color={theme.textSecondary} size={18} />
              Copy link
            </ShareAction>

            <ShareAction onClick={shareTweet}>
              <Twitter color={theme.textSecondary} size={18} />
              Share to Twitter
            </ShareAction>
          </ShareActions>
        )}
      </ShareButtonDisplay>
      <LinkCopied show={showCopied}>
        <Check color={theme.accentSuccess} />
        Link Copied
      </LinkCopied>
    </>
  )
}
