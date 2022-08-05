import { t } from '@lingui/macro'
import React, { useMemo, useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Share2, X } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { Telegram } from 'components/Icons'
import Discord from 'components/Icons/Discord'
import Facebook from 'components/Icons/Facebook'
import TwitterIcon from 'components/Icons/TwitterIcon'
import Modal from 'components/Modal'
import { MouseoverTooltip } from 'components/Tooltip'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ButtonText, ExternalLink } from 'theme'

import { ButtonPrimary } from '../Button'
import { RowBetween } from '../Row'

const ButtonWrapper = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;

  a {
    width: 64px;
    height: 64px;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 8px;
    &:hover {
      background-color: ${({ theme }) => theme.buttonBlack};
    }
  }
`

const InputWrapper = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 999px;
  padding: 4px;
  display: flex;
  width: 100%;
  input {
    border: none;
    outline: none;
    color: ${({ theme }) => theme.text};
    font-size: 14px;
    background: transparent;
    flex: 1;
    padding-left: 10px;
  }
`
const AlertMessage = styled.span`
  position: absolute;
  top: -25px;
  background: #ddd;
  color: #222;
  border-radius: 5px;
  font-size: 12px;
  padding: 3px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  &.show {
    visibility: visible;
    opacity: 0.9;
  }
`

const ButtonWithHoverEffect = ({ children, onClick }: { children: (color: string) => any; onClick: () => void }) => {
  const theme = useTheme()
  const [isHovering, setIsHovering] = useState<boolean>(false)
  const handleMouseEnter = () => {
    setIsHovering(true)
  }
  const handleMouseLeave = () => {
    setIsHovering(false)
  }
  return (
    <ButtonWrapper onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={onClick}>
      {children(isHovering ? theme.text : theme.subText)}
    </ButtonWrapper>
  )
}

export default function ShareModal({ url, onShared = () => null }: { url?: string; onShared?: () => void }) {
  const isOpen = useModalOpen(ApplicationModal.SHARE)
  const toggle = useToggleModal(ApplicationModal.SHARE)
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const { pathname } = useLocation()

  const modalTitle = pathname.startsWith('/swap')
    ? t`Share this with your friends!`
    : pathname.startsWith('/campaigns')
    ? t`Share this campaign with your friends!`
    : t`Share this pool with your friends!`

  const shareUrl = useMemo(() => {
    if (url) return url
    return window.location.href + `?networkId=${chainId}`
  }, [chainId, url])

  const [showAlert, setShowAlert] = useState(false)
  const handleCopyClick = () => {
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 2000)
    onShared()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={toggle}>
      <Flex flexDirection="column" alignItems="center" padding="25px" width="100%">
        <RowBetween>
          <Text fontSize={18} fontWeight={500}>
            {modalTitle}
          </Text>
          <ButtonText onClick={toggle} style={{ lineHeight: '0' }}>
            <X color={theme.text} />
          </ButtonText>
        </RowBetween>
        <Flex justifyContent="space-between" padding="32px 0" width="100%">
          <ButtonWithHoverEffect onClick={onShared}>
            {(color: string) => (
              <>
                <ExternalLink href={'https://telegram.me/share/url?url=' + encodeURIComponent(shareUrl)}>
                  <Telegram size={36} color={color} />
                </ExternalLink>
                <Text>Telegram</Text>
              </>
            )}
          </ButtonWithHoverEffect>
          <ButtonWithHoverEffect onClick={onShared}>
            {(color: string) => (
              <>
                <ExternalLink href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareUrl)}>
                  <TwitterIcon width={36} height={36} color={color} />
                </ExternalLink>
                <Text>Twitter</Text>
              </>
            )}
          </ButtonWithHoverEffect>
          <ButtonWithHoverEffect onClick={onShared}>
            {(color: string) => (
              <>
                <ExternalLink href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl)}>
                  <Facebook color={color} />
                </ExternalLink>
                <Text>Facebook</Text>
              </>
            )}
          </ButtonWithHoverEffect>
          <ButtonWithHoverEffect onClick={onShared}>
            {(color: string) => (
              <CopyToClipboard
                text={shareUrl}
                onCopy={() => {
                  handleCopyClick()
                  window.open('https://discord.com/app/', '_blank')
                }}
              >
                <div>
                  <a href="https://discord.com/app/" onClick={e => e.preventDefault()}>
                    <Discord width={36} height={36} color={color} />
                  </a>
                  <Text>Discord</Text>
                </div>
              </CopyToClipboard>
            )}
          </ButtonWithHoverEffect>
        </Flex>
        <InputWrapper>
          <input type="text" value={shareUrl} />
          <CopyToClipboard text={shareUrl} onCopy={handleCopyClick}>
            <ButtonPrimary fontSize={14} padding="8px 12px" width="auto">
              Copy Link
              <AlertMessage className={showAlert ? 'show' : ''}>Copied!</AlertMessage>
            </ButtonPrimary>
          </CopyToClipboard>
        </InputWrapper>
      </Flex>
    </Modal>
  )
}

export function ShareButtonWithModal({ url, onShared }: { url?: string; onShared?: () => void }) {
  const theme = useTheme()
  const toggle = useToggleModal(ApplicationModal.SHARE)

  return (
    <>
      <StyledActionButtonSwapForm onClick={toggle}>
        <MouseoverTooltip text={t`Share`} placement="top" width="fit-content">
          <Share2 size={18} color={theme.subText} />
        </MouseoverTooltip>
      </StyledActionButtonSwapForm>
      <ShareModal url={url} onShared={onShared} />
    </>
  )
}
