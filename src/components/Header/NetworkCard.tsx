import { Trans } from '@lingui/macro'
import { YellowCard } from 'components/Card'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useActiveWeb3React } from 'hooks/web3'
import { useEffect, useRef, useState } from 'react'
import { ArrowDownCircle } from 'react-feather'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import styled, { css } from 'styled-components/macro'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { switchToNetwork } from 'utils/switchToNetwork'
import { CHAIN_INFO, L2_CHAIN_IDS, NETWORK_LABELS, SupportedChainId, SupportedL2ChainId } from '../../constants/chains'

const StopOverflowQuery = `@media screen and (min-width: ${MEDIA_WIDTHS.upToMedium + 1}px) and (max-width: ${
  MEDIA_WIDTHS.upToMedium + 500
}px)`

const BaseWrapper = css`
  position: relative;
  ${StopOverflowQuery} {
    position: absolute;
    top: 80px;
    right: 20px;
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-left: 12px;
  `};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0 0.5rem 0 0;
    width: initial;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  `};
`
const L2Wrapper = styled.div`
  ${BaseWrapper}
`
const BaseMenuItem = css`
  align-items: center;
  background-color: transparent;
  border-radius: 12px;
  color: ${({ theme }) => theme.text2};
  cursor: pointer;
  display: flex;
  flex: 1;
  flex-direction: row;
  font-size: 14px;
  font-weight: 400;
  justify-content: space-between;
  :hover {
    color: ${({ theme }) => theme.text1};
    text-decoration: none;
  }
`
const DisabledMenuItem = styled.div`
  ${BaseMenuItem}
  align-items: center;
  background-color: ${({ theme }) => theme.bg2};
  cursor: auto;
  display: flex;
  font-size: 10px;
  font-style: italic;
  justify-content: center;
  :hover,
  :active,
  :focus {
    color: ${({ theme }) => theme.text2};
  }
`
const FallbackWrapper = styled(YellowCard)`
  ${BaseWrapper}
  width: auto;
  border-radius: 12px;
  padding: 8px 12px;
`
const Icon = styled.img`
  width: 17px;
`
const L1Tag = styled.div`
  color: #c4d9f8;
  opacity: 40%;
`
const L2Tag = styled.div<{ chainId: SupportedL2ChainId }>`
  background-color: ${({ chainId }) => (chainId === SupportedChainId.ARBITRUM_ONE ? '#28A0F0' : '#FF0420')};
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
`
const MenuFlyout = styled.span`
  background-color: ${({ theme }) => theme.bg2};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 20px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  left: 0rem;
  top: 3rem;
  z-index: 100;
  width: 237px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    top: -10.25rem;
  `};
  > {
    padding: 12px;
  }
  > :not(:first-child) {
    margin-top: 8px;
  }
  > :not(:last-child) {
    margin-bottom: 8px;
  }
  ${StopOverflowQuery} {
    left: unset;
    right: 0rem;
  }
`
const LinkOutCircle = styled(ArrowDownCircle)`
  transform: rotate(230deg);
  width: 20px;
  height: 20px;
`
const MenuItem = styled(ExternalLink)`
  ${BaseMenuItem}
`
const ButtonMenuItem = styled.button`
  ${BaseMenuItem}
  border: none;
  box-shadow: none;
  color: ${({ theme }) => theme.text2};
  outline: none;
  padding-left: 0;
`
const NetworkInfo = styled.button`
  align-items: center;
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 8px;
  border: none;
  color: ${({ theme }) => theme.text1};
  display: flex;
  flex-direction: row;
  font-weight: 500;
  font-size: 12px;
  height: 100%;
  justify-content: space-between;
  margin: 0;
  padding: 8px;
  width: 188px;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg3};
  }
`
const NetworkLabel = styled.span`
  flex: 1 1 auto;
`

export default function NetworkCard() {
  const { chainId, library } = useActiveWeb3React()
  const node = useRef<HTMLDivElement>(null)
  const open = useModalOpen(ApplicationModal.ARBITRUM_OPTIONS)
  const toggle = useToggleModal(ApplicationModal.ARBITRUM_OPTIONS)
  useOnClickOutside(node, open ? toggle : undefined)

  const [implements3085, setImplements3085] = useState(false)
  useEffect(() => {
    // metamask is currently the only known implementer of this EIP
    // here we proceed w/ a noop feature check to ensure the user's version of metamask supports network switching
    // if not, we hide the UI
    if (!library?.provider?.request || !chainId || !library?.provider?.isMetaMask) {
      return
    }
    switchToNetwork({ library, chainId })
      .then((x) => x ?? setImplements3085(true))
      .catch(() => setImplements3085(false))
  }, [library, chainId])

  if (!chainId || chainId === SupportedChainId.MAINNET || !NETWORK_LABELS[chainId] || !library) {
    return null
  }

  if (L2_CHAIN_IDS.includes(chainId)) {
    const info = CHAIN_INFO[chainId as SupportedL2ChainId]
    const isArbitrum = [SupportedChainId.ARBITRUM_ONE, SupportedChainId.ARBITRUM_RINKEBY].includes(chainId)
    return (
      <L2Wrapper ref={node}>
        <NetworkInfo onClick={toggle}>
          <Icon src={info.logoUrl} />
          <NetworkLabel>{info.label}</NetworkLabel>
          <L2Tag chainId={chainId}>L2</L2Tag>
        </NetworkInfo>
        {open && (
          <MenuFlyout>
            <MenuItem href={info.bridge}>
              <div>{isArbitrum ? <Trans>{info.label} Bridge</Trans> : <Trans>Optimism Gateway</Trans>}</div>
              <LinkOutCircle />
            </MenuItem>
            <MenuItem href={info.explorer}>
              {isArbitrum ? <Trans>{info.label} Explorer</Trans> : <Trans>Etherscan</Trans>}
              <LinkOutCircle />
            </MenuItem>
            <MenuItem href={info.docs}>
              <div>
                <Trans>Learn more</Trans>
              </div>
              <LinkOutCircle />
            </MenuItem>
            {implements3085 ? (
              <ButtonMenuItem onClick={() => switchToNetwork({ library, chainId: SupportedChainId.MAINNET })}>
                <div>
                  <Trans>Switch to Ethereum</Trans>
                </div>
                <L1Tag>L1</L1Tag>
              </ButtonMenuItem>
            ) : (
              <DisabledMenuItem>
                <Trans>Change your network to go back to L1</Trans>
              </DisabledMenuItem>
            )}
          </MenuFlyout>
        )}
      </L2Wrapper>
    )
  }

  return <FallbackWrapper title={NETWORK_LABELS[chainId]}>{NETWORK_LABELS[chainId]}</FallbackWrapper>
}
