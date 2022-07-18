import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { darken } from 'polished'
import { ReactNode, useRef, useState } from 'react'
import { Check, Link, Share, Twitter } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components/macro'

const ShareButtonDisplay = styled.div`
  display: flex;
  cursor: pointer;
  position: relative;

  &:hover {
    color: ${({ theme }) => darken(0.1, theme.text2)};
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
  background-color: ${({ theme }) => theme.bg0};
  border: 1px solid ${({ theme }) => theme.bg1};
  box-shadow: 0px 1px 6px rgba(0, 0, 0, 0.9), 0px 8px 12px rgba(13, 14, 14, 0.8);
  border-radius: 12px;
`
const ShareAction = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;

  width: 200px;
  height: 48px;
  color: ${({ theme }) => theme.text1};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => darken(0.08, theme.text1)};
    background-color: ${({ theme }) => darken(0.08, theme.bg1)};
  }
`
const LinkCopied = styled.div<{ show: boolean }>`
  display: ${({ show }) => (show ? 'flex' : 'none')};
  width: 328px;
  height: 72px;
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.bg0};
  justify-content: flex-start;
  align-items: center;
  padding: 24px 16px;
  position: absolute;
  right: 32px;
  bottom: 32px;
  font-size: 14px;
  gap: 8px;
  border: 1px solid rgba(153, 161, 189, 0.08);
  box-shadow: 0px 1px 6px rgba(0, 0, 0, 0.9), 0px 8px 12px rgba(13, 14, 14, 0.8);
  border-radius: 20px;

  -moz-animation: cssAnimation 0s ease-in 3s forwards;
  -webkit-animation: cssAnimation 0s ease-in 3s forwards;
  -o-animation: cssAnimation 0s ease-in 3s forwards;
  animation: cssAnimation 0s ease-in 3s forwards;
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;

  @keyframes cssAnimation {
    to {
      width: 0;
      height: 0;
      overflow: hidden;
      display: none;
    }
  }
  @-webkit-keyframes cssAnimation {
    to {
      width: 0;
      height: 0;
      visibility: hidden;
      display: none;
    }
  }
`

export default function ShareButton({ tokenName, tokenSymbol }: { tokenName: ReactNode; tokenSymbol: ReactNode }) {
  const theme = useTheme()
  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.SHARE)
  const toggleShare = useToggleModal(ApplicationModal.SHARE)
  useOnClickOutside(node, open ? toggleShare : undefined)
  const [showCopied, setShowCopied] = useState(false)

  const shareTweet = () => {
    toggleShare()
    window.open(
      `https://twitter.com/intent/tweet?text=Check%20out%20${tokenName}%20(${tokenSymbol})%20https://app.uniswap.org/%23/tokens/${tokenSymbol}%20via%20@uniswap`
    )
  }
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setShowCopied(true)
    toggleShare()
    setTimeout(() => setShowCopied(false), 3000)
  }

  return (
    <>
      <ShareButtonDisplay ref={node}>
        <Share size={18} onClick={toggleShare} aria-label={`ShareOptions`} />
        {open && (
          <ShareActions>
            <ShareAction onClick={copyLink}>
              <Link color={theme.text2} />
              Copy link
            </ShareAction>

            <ShareAction onClick={shareTweet}>
              <Twitter color={theme.text2} />
              Share to Twitter
            </ShareAction>
          </ShareActions>
        )}
      </ShareButtonDisplay>
      <LinkCopied show={showCopied}>
        <Check color={theme.green1} />
        Link Copied
      </LinkCopied>
    </>
  )
}
