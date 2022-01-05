import React, { useContext, useState, useMemo } from 'react'
import TwitterIcon from 'components/Icons/TwitterIcon'
import Discord from 'components/Icons/Discord'
import { Telegram } from 'components/Icons'
import Facebook from 'components/Icons/Facebook'
import { ExternalLink } from 'theme'
import { KYBER_NETWORK_DISCORD_URL, KYBER_NETWORK_TWITTER_URL } from 'constants/index'
import Modal from 'components/Modal'
import { Text, Flex } from 'rebass'
import { RowBetween } from '../Row'
import { ButtonText } from '../../theme'
import { Trans } from '@lingui/macro'
import { X, Share2 } from 'react-feather'
import styled, { ThemeContext } from 'styled-components'
import { ButtonPrimary } from '../Button'
import { currencyId } from 'utils/currencyId'
import { Field } from 'state/swap/actions'
import { Currency } from '@dynamic-amm/sdk'
import { useActiveWeb3React } from 'hooks'
import { useLocation } from 'react-router-dom'
import { CopyToClipboard } from 'react-copy-to-clipboard'

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
      background-color: ${({ theme }) => theme.bg12};
    }
  }
`

const InputWrapper = styled.div`
  background-color: ${({ theme }) => theme.bg12};
  border-radius: 4px;
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
const IconButton = styled.button`
  cursor: pointer;
  height: 36px;
  width: 36px;
  border-radius: 4px;
  //transition: background 0.2s;
  outline: none;
  border: none;
  padding: 0;
  margin: 0;
  background-color: transparent;
  display: flex;
  justify-content: center;
  align-items: center;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.buttonBlack};
  }
`

const ShareButton = styled(IconButton)`
  svg {
    circle {
      fill: ${({ theme }) => theme.text};
    }
  }
`

const ButtonWithHoverEffect = ({ children }: { children: (color: string) => any }) => {
  const theme = useContext(ThemeContext)
  const [isHovering, setIsHovering] = useState<boolean>(false)
  const handleMouseEnter = () => {
    setIsHovering(true)
  }
  const handleMouseLeave = () => {
    setIsHovering(false)
  }
  return (
    <ButtonWrapper onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children(isHovering ? theme.text : theme.subText)}
    </ButtonWrapper>
  )
}

export default function ShareModal({ currencies }: { currencies?: { [field in Field]?: Currency } }) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()
  const [isShow, setIsShow] = useState<boolean>(false)
  const { pathname } = useLocation()
  const isSwapPage = pathname.startsWith('/swap')

  const shareUrl = useMemo(() => {
    if (!isSwapPage) {
      return window.location.href + `?networkId=${chainId}`
    }
    if (isSwapPage && currencies && currencies[Field.INPUT] && currencies[Field.OUTPUT]) {
      return (
        window.location.origin +
        `/#/swap?inputCurrency=${currencyId(currencies[Field.INPUT] as Currency, chainId)}&outputCurrency=${currencyId(
          currencies[Field.OUTPUT] as Currency,
          chainId
        )}&networkId=${chainId}`
      )
    }
    return window.location.href
  }, [currencies, isSwapPage])

  const [showAlert, setShowAlert] = useState(false)
  const handleCopyClick = () => {
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 2000)
  }

  return (
    <>
      <ShareButton onClick={() => setIsShow(true)}>
        <Share2 size={16} color={theme.text} />
      </ShareButton>

      <Modal isOpen={isShow} onDismiss={() => setIsShow(false)}>
        <Flex flexDirection="column" alignItems="center" padding="25px" width="100%">
          <RowBetween>
            <Text fontSize={18} fontWeight={500}>
              {isSwapPage ? (
                <Trans>Share this token with your friends!</Trans>
              ) : (
                <Trans>Share this pool with your friends!</Trans>
              )}
            </Text>
            <ButtonText onClick={() => setIsShow(false)}>
              <X color={theme.text} />
            </ButtonText>
          </RowBetween>
          <Flex justifyContent="space-between" padding="32px 0" width="100%">
            <ButtonWithHoverEffect>
              {(color: string) => (
                <>
                  <ExternalLink href={'https://telegram.me/share/url?url=' + encodeURIComponent(shareUrl)}>
                    <Telegram size={36} color={color} />
                  </ExternalLink>
                  <Text>Telegram</Text>
                </>
              )}
            </ButtonWithHoverEffect>
            <ButtonWithHoverEffect>
              {(color: string) => (
                <>
                  <ExternalLink href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareUrl)}>
                    <TwitterIcon width={36} height={36} color={color} />
                  </ExternalLink>
                  <Text>Twitter</Text>
                </>
              )}
            </ButtonWithHoverEffect>
            <ButtonWithHoverEffect>
              {(color: string) => (
                <>
                  <ExternalLink href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl)}>
                    <Facebook color={color} />
                  </ExternalLink>
                  <Text>Facebook</Text>
                </>
              )}
            </ButtonWithHoverEffect>
            <ButtonWithHoverEffect>
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
              <ButtonPrimary fontSize={14} padding="12px" width="auto">
                Copy Link
                <AlertMessage className={showAlert ? 'show' : ''}>Copied!</AlertMessage>
              </ButtonPrimary>
            </CopyToClipboard>
          </InputWrapper>
        </Flex>
      </Modal>
    </>
  )
}
