import { Trans } from '@lingui/macro'
import { CHAIN_INFO, SupportedChainId } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useRef } from 'react'
import { ArrowDownCircle, ChevronDown } from 'react-feather'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { addPopup, ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components/macro'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

import { useAppDispatch } from '../../state/hooks'
import { switchToNetwork } from '../../utils/switchToNetwork'

const ActiveRowLinkList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  & > a {
    align-items: center;
    color: ${({ theme }) => theme.text2};
    display: flex;
    flex-direction: row;
    font-size: 14px;
    font-weight: 500;
    justify-content: space-between;
    padding: 8px 0 4px;
    text-decoration: none;
  }
  & > a:first-child {
    margin: 0;
    margin-top: 0px;
    padding-top: 10px;
  }
`
const ActiveRowWrapper = styled.div`
  background-color: ${({ theme }) => theme.bg1};
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
  background-color: ${({ theme }) => theme.bg0};
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
const FlyoutRow = styled.div<{ active: boolean }>`
  align-items: center;
  background-color: ${({ active, theme }) => (active ? theme.bg1 : 'transparent')};
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
const SelectorLabel = styled(NetworkLabel)`
  display: none;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
    margin-right: 8px;
  }
`
const SelectorControls = styled.div<{ interactive: boolean }>`
  align-items: center;
  background-color: ${({ theme }) => theme.bg0};
  border: 2px solid ${({ theme }) => theme.bg0};
  border-radius: 16px;
  color: ${({ theme }) => theme.text1};
  cursor: ${({ interactive }) => (interactive ? 'pointer' : 'auto')};
  display: flex;
  font-weight: 500;
  justify-content: space-between;
  padding: 6px 8px;
`
const SelectorLogo = styled(Logo)<{ interactive?: boolean }>`
  margin-right: ${({ interactive }) => (interactive ? 8 : 0)}px;
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
  width: 16px;
`
const BridgeLabel = ({ chainId }: { chainId: SupportedChainId }) => {
  switch (chainId) {
    case SupportedChainId.ARBITRUM_ONE:
    case SupportedChainId.ARBITRUM_RINKEBY:
      return <Trans>Arbitrum Bridge</Trans>
    case SupportedChainId.OPTIMISM:
    case SupportedChainId.OPTIMISTIC_KOVAN:
      return <Trans>Optimism Gateway</Trans>
    case SupportedChainId.POLYGON:
    case SupportedChainId.POLYGON_MUMBAI:
      return <Trans>Polygon Bridge</Trans>
    default:
      return <Trans>Bridge</Trans>
  }
}
const ExplorerLabel = ({ chainId }: { chainId: SupportedChainId }) => {
  switch (chainId) {
    case SupportedChainId.ARBITRUM_ONE:
    case SupportedChainId.ARBITRUM_RINKEBY:
      return <Trans>Arbiscan</Trans>
    case SupportedChainId.OPTIMISM:
    case SupportedChainId.OPTIMISTIC_KOVAN:
      return <Trans>Optimistic Etherscan</Trans>
    case SupportedChainId.POLYGON:
    case SupportedChainId.POLYGON_MUMBAI:
      return <Trans>Polygonscan</Trans>
    default:
      return <Trans>Etherscan</Trans>
  }
}

function Row({
  targetChain,
  onSelectChain,
}: {
  targetChain: SupportedChainId
  onSelectChain: (targetChain: number) => void
}) {
  const { library, chainId } = useActiveWeb3React()
  if (!library || !chainId) {
    return null
  }
  const active = chainId === targetChain
  const { helpCenterUrl, explorer, bridge, label, logoUrl } = CHAIN_INFO[targetChain]

  const rowContent = (
    <FlyoutRow onClick={() => onSelectChain(targetChain)} active={active}>
      <Logo src={logoUrl} />
      <NetworkLabel>{label}</NetworkLabel>
      {chainId === targetChain && <FlyoutRowActiveIndicator />}
    </FlyoutRow>
  )

  if (active) {
    return (
      <ActiveRowWrapper>
        {rowContent}
        <ActiveRowLinkList>
          {bridge ? (
            <ExternalLink href={bridge}>
              <BridgeLabel chainId={chainId} /> <LinkOutCircle />
            </ExternalLink>
          ) : null}
          {explorer ? (
            <ExternalLink href={explorer}>
              <ExplorerLabel chainId={chainId} /> <LinkOutCircle />
            </ExternalLink>
          ) : null}
          {helpCenterUrl ? (
            <ExternalLink href={helpCenterUrl}>
              <Trans>Help Center</Trans> <LinkOutCircle />
            </ExternalLink>
          ) : null}
        </ActiveRowLinkList>
      </ActiveRowWrapper>
    )
  }
  return rowContent
}

export default function NetworkSelector() {
  const { chainId, library } = useActiveWeb3React()
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.NETWORK_SELECTOR)
  const toggle = useToggleModal(ApplicationModal.NETWORK_SELECTOR)
  useOnClickOutside(node, open ? toggle : undefined)

  const info = chainId ? CHAIN_INFO[chainId] : undefined

  const dispatch = useAppDispatch()

  const handleRowClick = useCallback(
    (targetChain: number) => {
      if (!library) return
      switchToNetwork({ library, chainId: targetChain })
        .then(() => toggle())
        .catch((error) => {
          console.error('Failed to switch networks', error)
          toggle()
          dispatch(addPopup({ content: { failedSwitchNetwork: targetChain }, key: `failed-network-switch` }))
        })
    },
    [dispatch, library, toggle]
  )

  if (!chainId || !info || !library) {
    return null
  }

  return (
    <SelectorWrapper ref={node as any}>
      <SelectorControls onClick={toggle} interactive>
        <SelectorLogo interactive src={info.logoUrl} />
        <SelectorLabel>{info.label}</SelectorLabel>
        <StyledChevronDown />
      </SelectorControls>
      {open && (
        <FlyoutMenu onMouseLeave={toggle}>
          <FlyoutHeader>
            <Trans>Select a network</Trans>
          </FlyoutHeader>
          <Row onSelectChain={handleRowClick} targetChain={SupportedChainId.MAINNET} />
          <Row onSelectChain={handleRowClick} targetChain={SupportedChainId.POLYGON} />
          <Row onSelectChain={handleRowClick} targetChain={SupportedChainId.OPTIMISM} />
          <Row onSelectChain={handleRowClick} targetChain={SupportedChainId.ARBITRUM_ONE} />
        </FlyoutMenu>
      )}
    </SelectorWrapper>
  )
}
