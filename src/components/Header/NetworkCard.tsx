import { Trans } from '@lingui/macro'
import { YellowCard } from 'components/Card'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useActiveWeb3React } from 'hooks/web3'
import { useEffect, useRef, useState } from 'react'
import { ArrowDownCircle, ChevronDown, ToggleLeft } from 'react-feather'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import styled, { css } from 'styled-components/macro'
import { ExternalLink } from 'theme'
import { switchToNetwork } from 'utils/switchToNetwork'
import { CHAIN_INFO, L2_CHAIN_IDS, SupportedChainId, SupportedL2ChainId } from '../../constants/chains'

const BaseWrapper = css`
  position: relative;
  margin-right: 8px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    justify-self: end;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0 0.5rem 0 0;
    width: initial;
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
  font-size: 16px;
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
  width: 100%;
  user-select: none;
`
const Icon = styled.img`
  width: 16px;
  margin-right: 2px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
  margin-right: 4px;

  `};
`

const MenuFlyout = styled.span`
  background-color: ${({ theme }) => theme.bg1};
  border: 1px solid ${({ theme }) => theme.bg0};

  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  left: 0rem;
  top: 3rem;
  z-index: 100;
  width: 237px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
   
    bottom: unset;
    top: 4.5em
    right: 0;

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
`
const LinkOutCircle = styled(ArrowDownCircle)`
  transform: rotate(230deg);
  width: 16px;
  height: 16px;
  opacity: 0.6;
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
  padding: 0;
`
const NetworkInfo = styled.button<{ chainId: SupportedChainId }>`
  align-items: center;
  background-color: ${({ theme }) => theme.bg0};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.bg0};
  color: ${({ theme }) => theme.text1};
  display: flex;
  flex-direction: row;
  font-weight: 500;
  font-size: 12px;
  height: 100%;
  margin: 0;
  height: 38px;
  padding: 0.7rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    border: 1px solid ${({ theme }) => theme.bg3};
  }
`
const NetworkName = styled.div<{ chainId: SupportedChainId }>`
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  padding: 0 2px 0.5px 4px;
  margin: 0 2px;
  white-space: pre;
  ${({ theme }) => theme.mediaWidth.upToSmall`
   display: none;
  `};
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

  const info = chainId ? CHAIN_INFO[chainId] : undefined
  if (!chainId || chainId === SupportedChainId.MAINNET || !info || !library) {
    return null
  }

  if (L2_CHAIN_IDS.includes(chainId)) {
    const info = CHAIN_INFO[chainId as SupportedL2ChainId]
    const isArbitrum = [SupportedChainId.ARBITRUM_ONE, SupportedChainId.ARBITRUM_RINKEBY].includes(chainId)
    return (
      <L2Wrapper ref={node}>
        <NetworkInfo onClick={toggle} chainId={chainId}>
          <Icon src={info.logoUrl} />
          <NetworkName chainId={chainId}>{info.label}</NetworkName>
          <ChevronDown size={16} style={{ marginTop: '2px' }} strokeWidth={2.5} />
        </NetworkInfo>
        {open && (
          <MenuFlyout>
            <MenuItem href={info.bridge}>
              <div>{isArbitrum ? <Trans>{info.label} Bridge</Trans> : <Trans>Optimistic L2 Gateway</Trans>}</div>
              <LinkOutCircle />
            </MenuItem>
            <MenuItem href={info.explorer}>
              {isArbitrum ? <Trans>{info.label} Explorer</Trans> : <Trans>Optimistic Etherscan</Trans>}
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
                  <Trans>Switch to L1 (Mainnet)</Trans>
                </div>
                <ToggleLeft opacity={0.6} size={16} />
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

  return <FallbackWrapper title={info.label}>{info.label}</FallbackWrapper>
}
