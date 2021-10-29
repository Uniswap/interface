import { Trans } from '@lingui/macro'
import flashbotsProtectShieldOff from 'assets/images/flashbots-protect-shield-off.png'
import flashbotsProtectShieldOn from 'assets/images/flashbots-protect-shield-on.png'
import useIsFlashbotsProtectRPC from 'hooks/useIsFlashbotsProtectRPC'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useRef } from 'react'
import { ChevronDown } from 'react-feather'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'

import { ButtonSecondary } from '../Button'

const FlyoutHeader = styled.div`
  color: ${({ theme }) => theme.text2};
  font-weight: 400;
`
const FlyoutMenu = styled.div`
  align-items: flex-start;
  background-color: ${({ theme }) => theme.bg1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  overflow: auto;
  padding: 16px;
  position: absolute;
  top: 64px;
  width: 272px;
  z-index: 99;
  & > *:not(:last-child) {
    margin-bottom: 12px;
  }
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    top: 50px;
  }
`
const FlyoutRow = styled.div`
  align-items: center;
  background-color: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: block;
  font-weight: 500;
  justify-content: space-between;
  padding: 6px 0;
  text-align: left;
  width: 100%;
`

const SubRow = styled.div`
  color: ${({ theme }) => theme.text2};
  padding: 4px 0;
  font-weight: 300;
`
const Shield = styled.img`
  height: 20px;
  width: 20px;
  margin-right: 8px;
`

const NetworkLabel = styled.div`
  flex: 1 1 auto;
`

const SelectorLabel = styled(NetworkLabel)`
  display: none;
  white-space: nowrap;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
    margin-right: 8px;
  }
`
const SelectorControls = styled.div<{ interactive: boolean }>`
  align-items: center;
  background-color: ${({ theme }) => theme.bg1};
  border: 2px solid ${({ theme }) => theme.bg1};
  border-radius: 12px;
  color: ${({ theme }) => theme.text1};
  cursor: ${({ interactive }) => (interactive ? 'pointer' : 'auto')};
  display: flex;
  font-weight: 500;
  justify-content: space-between;
  padding: 6px 8px;
`
const ShieldWrapper = styled.div<{ active?: boolean }>`
  height: 20px;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    background-color: ${({ theme, active }) => (active ? theme.green1 : theme.red2)};
    width: 5px;
    height: 5px;
    border: 1px solid ${({ theme }) => theme.bg1};
    border-radius: 3px;
    top: -1px;
    right: 5px;
  }
`

const StatusText = styled.span<{ active: boolean }>`
  color: ${({ theme, active }) => (active ? theme.green1 : theme.red2)};
`
const ShieldLogo = styled(Shield)`
  margin-right: 8px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    margin-right: 8px;
  }
`
const SelectorWrapper = styled.div`
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    position: relative;
  }
`
const StyledChevronDown = styled(ChevronDown)`
  width: 12px;
`

const Action = styled(ButtonSecondary)`
  width: fit-content;
  font-weight: 400;
  font-size: 0.825rem;
  padding: 4px 6px;
  :hover {
    cursor: pointer;
    text-decoration: underline;
  }
`

export default function FlashbotsProtect() {
  const { chainId, library } = useActiveWeb3React()
  const node = useRef<HTMLDivElement>()
  const [isFlashRPC, detectFlashRPC] = useIsFlashbotsProtectRPC()
  const open = useModalOpen(ApplicationModal.FLASHBOTS_PROTECT)
  const toggle = useToggleModal(ApplicationModal.FLASHBOTS_PROTECT)
  useOnClickOutside(node, open ? toggle : undefined)

  const showSelector = Boolean(chainId === 1)

  const conditionalToggle = useCallback(() => {
    if (showSelector) {
      toggle()
    }
  }, [showSelector, toggle])

  if (!chainId || !library) {
    return null
  }

  const shieldLogo = isFlashRPC ? flashbotsProtectShieldOn : flashbotsProtectShieldOff

  return (
    <SelectorWrapper ref={node as any}>
      <SelectorControls onClick={conditionalToggle} interactive={showSelector}>
        <ShieldWrapper active={isFlashRPC}>
          <ShieldLogo src={shieldLogo} />
        </ShieldWrapper>
        <SelectorLabel>MEV Shield</SelectorLabel>
        {showSelector && <StyledChevronDown />}
      </SelectorControls>
      {open && (
        <FlyoutMenu>
          <FlyoutHeader>
            <Trans>
              Sandwich Protection: <StatusText active={isFlashRPC}>{isFlashRPC ? 'ON' : 'OFF'}</StatusText>
            </Trans>
          </FlyoutHeader>
          {!isFlashRPC && (
            <FlyoutRow>
              Connect to the RPC
              <SubRow>Name: Flashbots Protect</SubRow>
              <SubRow>URL: https://rpc.flashbots.net</SubRow>
              <SubRow>Chain ID: 1</SubRow>
              <SubRow>Currency Symbol: ETH</SubRow>
            </FlyoutRow>
          )}
          <Action onClick={detectFlashRPC}>Refresh RPC Status</Action>
        </FlyoutMenu>
      )}
    </SelectorWrapper>
  )
}
