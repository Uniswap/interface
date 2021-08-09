import { Trans } from '@lingui/macro'
import { CHAIN_INFO, L2_CHAIN_IDS, SupportedChainId, SupportedL2ChainId } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useRef } from 'react'
import { ArrowDownCircle, ChevronDown } from 'react-feather'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { useAppSelector } from 'state/hooks'
import styled from 'styled-components/macro'
import { ExternalLink } from 'theme'
import { switchToNetwork } from 'utils/switchToNetwork'

const ActiveRowLinkList = styled.div`
  border-top: 1px solid #3b3c3f;
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  & > a {
    align-items: center;
    color: ${({ theme }) => theme.text1};
    display: flex;
    flex-direction: row;
    font-size: 12px;
    font-weight: 500;
    justify-content: space-between;
    margin-top: 8px;
    text-decoration: none;
  }
`
const ActiveRowWrapper = styled.div`
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 8px;
  cursor: pointer;
  padding: 8px;
  width: 100%;
`
const FlyoutHeader = styled.div`
  color: ${({ theme }) => theme.text2};
  font-weight: 400;
`
const FlyoutMenu = styled.div`
  align-items: flex-start;
  background-color: ${({ theme }) => theme.bg1};
  top: 50px;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  overflow: auto;
  padding: 16px;
  position: absolute;
  width: 272px;
  z-index: 99;

  & > *:not(:last-child) {
    margin-bottom: 12px;
  }
`
const FlyoutRow = styled.div<{ active: boolean }>`
  align-items: center;
  background-color: ${({ active, theme }) => (active ? theme.bg2 : 'transparent')};
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  font-weight: 500;
  justify-content: space-between;
  padding: 6px 8px;
  text-align: left;
  width: 100%;
`
const FlyoutRowActiveIndicator = styled.div`
  background-color: ${({ theme }) => theme.green1};
  border-radius: 50%;
  height: 9px;
  width: 9px;
`
const LinkOutCircle = styled(ArrowDownCircle)`
  transform: rotate(230deg);
  width: 16px;
  height: 16px;
`
const Logo = styled.img`
  height: 20px;
  width: 20px;
  margin-right: 8px;
`
const NetworkLabel = styled.div`
  flex: 1 1 auto;
`
const SelectorControls = styled.div<{ canSwitchNetworks: boolean }>`
  align-items: center;
  background-color: ${({ theme }) => theme.bg1};
  border: 2px solid ${({ theme }) => theme.bg1};
  border-radius: 8px;
  color: ${({ theme }) => theme.text1};
  cursor: ${({ canSwitchNetworks }) => (canSwitchNetworks ? 'pointer' : 'auto')};
  display: flex;
  font-weight: 500;
  justify-content: space-between;
  padding: 6px 8px;
`
const SelectorWrapper = styled.div`
  position: relative;
`
const StyledChevronDown = styled(ChevronDown)`
  margin-left: 8px;
  width: 12px;
`
const BridgeText = ({ chainId }: { chainId: SupportedL2ChainId }) => {
  switch (chainId) {
    case SupportedChainId.ARBITRUM_ONE:
    case SupportedChainId.ARBITRUM_RINKEBY:
      return <Trans>Arbitrum Bridge</Trans>
    case SupportedChainId.OPTIMISM:
    case SupportedChainId.OPTIMISTIC_KOVAN:
      return <Trans>Optimism Gateway</Trans>
    default:
      return <Trans>Bridge</Trans>
  }
}
const ExplorerText = ({ chainId }: { chainId: SupportedL2ChainId }) => {
  switch (chainId) {
    case SupportedChainId.ARBITRUM_ONE:
    case SupportedChainId.ARBITRUM_RINKEBY:
      return <Trans>Arbitrum Explorer</Trans>
    case SupportedChainId.OPTIMISM:
    case SupportedChainId.OPTIMISTIC_KOVAN:
      return <Trans>Optimistic Etherscan</Trans>
    default:
      return <Trans>Explorer</Trans>
  }
}

export default function NetworkSelector() {
  const { chainId, library } = useActiveWeb3React()
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.NETWORK_SELECTOR)
  const toggle = useToggleModal(ApplicationModal.NETWORK_SELECTOR)

  useOnClickOutside(node, open ? toggle : undefined)
  const implements3085 = useAppSelector((state) => state.application.implements3085)
  const toggleWithFeatureCheck = useCallback(() => {
    if (implements3085) {
      toggle()
    }
  }, [implements3085, toggle])
  const info = chainId ? CHAIN_INFO[chainId] : undefined
  if (!chainId || !info || !library) {
    return null
  }

  const mainnetInfo = CHAIN_INFO[SupportedChainId.MAINNET]

  function Row({ targetChain }: { targetChain: number }) {
    if (!library || !chainId) {
      return null
    }
    const active = chainId === targetChain
    const hasExtendedInfo = L2_CHAIN_IDS.includes(targetChain)
    const RowContent = () => (
      <FlyoutRow onClick={() => switchToNetwork({ library, chainId: targetChain })} active={active}>
        <Logo src={CHAIN_INFO[targetChain].logoUrl} />
        <NetworkLabel>{CHAIN_INFO[targetChain].label}</NetworkLabel>
        {chainId === targetChain && <FlyoutRowActiveIndicator />}
      </FlyoutRow>
    )
    if (active && hasExtendedInfo) {
      return (
        <ActiveRowWrapper>
          <RowContent />
          <ActiveRowLinkList>
            <ExternalLink href={CHAIN_INFO[targetChain as SupportedL2ChainId].bridge}>
              <BridgeText chainId={chainId} /> <LinkOutCircle />
            </ExternalLink>
            <ExternalLink href={CHAIN_INFO[targetChain].explorer}>
              <ExplorerText chainId={chainId} /> <LinkOutCircle />
            </ExternalLink>
            <ExternalLink href={CHAIN_INFO[targetChain].infoLink}>
              <Trans>Help center</Trans> <LinkOutCircle />
            </ExternalLink>
          </ActiveRowLinkList>
        </ActiveRowWrapper>
      )
    }
    return <RowContent />
  }
  return (
    <SelectorWrapper ref={node as any}>
      <SelectorControls onClick={toggleWithFeatureCheck} canSwitchNetworks={implements3085}>
        <Logo src={info.logoUrl || mainnetInfo.logoUrl} />
        <NetworkLabel>{info.label}</NetworkLabel>
        {implements3085 && <StyledChevronDown />}
      </SelectorControls>
      {open && (
        <FlyoutMenu>
          <FlyoutHeader>
            <Trans>Select a network</Trans>
          </FlyoutHeader>
          <Row targetChain={SupportedChainId.MAINNET} />
          <Row targetChain={SupportedChainId.OPTIMISM} />
          {/* <Row targetChain={SupportedChainId.ARBITRUM_ONE} /> */}
        </FlyoutMenu>
      )}
    </SelectorWrapper>
  )
}
