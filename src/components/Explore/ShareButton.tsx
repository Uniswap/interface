import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { darken } from 'polished'
import { useRef } from 'react'
import { Link, Share, Twitter } from 'react-feather'
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

export default function ShareButton() {
  const theme = useTheme()
  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.SHARE)
  const toggleShare = useToggleModal(ApplicationModal.SHARE)
  useOnClickOutside(node, open ? toggleShare : undefined)
  const shareTweet = () => {
    toggleShare()
    window.open(`https://twitter.com/intent/tweet?text=app.uniswap.org`)
  }

  return (
    <ShareButtonDisplay ref={node}>
      <Share size={18} onClick={toggleShare} aria-label={`ShareOptions`} />
      {open && (
        <ShareActions>
          <ShareAction onClick={() => navigator.clipboard.writeText(window.location.href)}>
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
  )
}
