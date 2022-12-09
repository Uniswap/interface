import { t } from '@lingui/macro'
import { useState } from 'react'
import { Share2, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { Telegram } from 'components/Icons'
import Discord from 'components/Icons/Discord'
import Facebook from 'components/Icons/Facebook'
import TwitterIcon from 'components/Icons/TwitterIcon'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ButtonText, ExternalLink } from 'theme'

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

export default function ShareModal({
  title,
  url,
  onShared = () => null,
}: {
  title: string
  url?: string
  onShared?: () => void
}) {
  const isOpen = useModalOpen(ApplicationModal.SHARE)
  const toggle = useToggleModal(ApplicationModal.SHARE)
  const theme = useTheme()

  const [isCopied, setCopied] = useCopyClipboard()
  const shareUrl = url || window.location.href
  const handleCopyClick = () => {
    onShared()
    setCopied(shareUrl)
  }

  return (
    <Modal isOpen={isOpen} onDismiss={toggle}>
      <Flex flexDirection="column" alignItems="center" padding="25px" width="100%">
        <RowBetween>
          <Text fontSize={18} fontWeight={500}>
            {title}
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
              <>
                <ExternalLink href="https://discord.com/app/">
                  <Discord width={36} height={36} color={color} />
                </ExternalLink>
                <Text>Discord</Text>
              </>
            )}
          </ButtonWithHoverEffect>
        </Flex>
        <InputWrapper>
          <input type="text" value={shareUrl} />
          <ButtonPrimary onClick={handleCopyClick} fontSize={14} padding="8px 12px" width="auto">
            Copy Link
            <AlertMessage className={isCopied ? 'show' : ''}>Copied!</AlertMessage>
          </ButtonPrimary>
        </InputWrapper>
      </Flex>
    </Modal>
  )
}

type Props = { url?: string; onShared?: () => void; color?: string; title: string }

export const ShareButtonWithModal: React.FC<Props> = ({ url, onShared, color, title }) => {
  const theme = useTheme()
  const toggle = useToggleModal(ApplicationModal.SHARE)

  return (
    <>
      <StyledActionButtonSwapForm onClick={toggle}>
        <MouseoverTooltip text={t`Share`} placement="top" width="fit-content">
          <Share2 size={18} color={color || theme.subText} />
        </MouseoverTooltip>
      </StyledActionButtonSwapForm>
      <ShareModal url={url} onShared={onShared} title={title} />
    </>
  )
}
